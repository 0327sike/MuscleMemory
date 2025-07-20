require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Define the path to your SQLite database file within the 'database' folder
const DB_PATH = process.env.DB_PATH || './database/muscle_memory.db';

// Connect to the SQLite database
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err.message);
        process.exit(1); // Exit if connection fails
    } else {
        console.log(`Connected to SQLite database: ${DB_PATH}`);
    }
});

// Helper function to run SQL queries with Promises for better async handling
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
};

// Helper function to get a single row from SQL query with Promises
const getQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};


console.log("Initializing database schema and seeding data...");

// Use db.serialize to ensure commands run in sequence
db.serialize(async () => {
    try {
        // --- Create Tables ---
        console.log("Creating tables...");
        await runQuery(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'trainer')),
            created_at TEXT DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')),
            updated_at TEXT DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))
        );`);

        await runQuery(`CREATE TABLE IF NOT EXISTS user_profiles (
            user_id TEXT PRIMARY KEY,
            gender TEXT,
            date_of_birth TEXT,
            weight_unit TEXT DEFAULT 'lbs' CHECK (weight_unit IN ('kg', 'lbs')),
            height_unit TEXT DEFAULT 'inches' CHECK (height_unit IN ('cm', 'inches')),
            current_weight REAL,
            target_goal TEXT CHECK (target_goal IN ('Weight Loss', 'Muscle Gain', 'Endurance', 'General Fitness')),
            notification_daily_reminders INTEGER DEFAULT 1,
            notification_progress_alerts INTEGER DEFAULT 1,
            notification_client_messages INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')),
            updated_at TEXT DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );`);

        await runQuery(`CREATE TABLE IF NOT EXISTS exercises (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            muscle_group TEXT NOT NULL,
            equipment TEXT,
            difficulty TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
            thumbnail_url TEXT,
            video_url TEXT,
            instructions TEXT, -- Stored as JSON string
            tips TEXT,         -- Stored as JSON string
            created_at TEXT DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')),
            updated_at TEXT DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))
        );`);

        await runQuery(`CREATE TABLE IF NOT EXISTS workout_plans (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            target_goal TEXT NOT NULL CHECK (target_goal IN ('Weight Loss', 'Muscle Gain', 'Endurance', 'General Fitness')),
            difficulty TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
            description TEXT,
            is_template INTEGER DEFAULT 0 NOT NULL,
            created_by_user_id TEXT NOT NULL,
            assigned_to_user_id TEXT,
            created_at TEXT DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')),
            updated_at TEXT DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')),
            FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL
        );`);

        await runQuery(`CREATE TABLE IF NOT EXISTS workout_plan_days (
            id TEXT PRIMARY KEY,
            plan_id TEXT NOT NULL,
            day_name TEXT NOT NULL,
            focus TEXT,
            order_in_plan INTEGER NOT NULL,
            created_at TEXT DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')),
            updated_at TEXT DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')),
            FOREIGN KEY (plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE
        );`);

        await runQuery(`CREATE TABLE IF NOT EXISTS workout_plan_day_exercises (
            id TEXT PRIMARY KEY,
            plan_day_id TEXT NOT NULL,
            exercise_id TEXT NOT NULL,
            sets TEXT,
            reps TEXT,
            notes TEXT,
            order_in_day INTEGER NOT NULL,
            created_at TEXT DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')),
            updated_at TEXT DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')),
            FOREIGN KEY (plan_day_id) REFERENCES workout_plan_days(id) ON DELETE CASCADE,
            FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
        );`);

        await runQuery(`CREATE TABLE IF NOT EXISTS workout_logs (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            workout_plan_id TEXT,
            workout_plan_day_id TEXT,
            exercise_id TEXT NOT NULL,
            log_date TEXT NOT NULL, -- YYYY-MM-DD
            duration_minutes INTEGER,
            is_completed_day INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')),
            updated_at TEXT DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(id) ON DELETE SET NULL,
            FOREIGN KEY (workout_plan_day_id) REFERENCES workout_plan_days(id) ON DELETE SET NULL,
            FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
        );`);

        await runQuery(`CREATE TABLE IF NOT EXISTS workout_log_sets (
            id TEXT PRIMARY KEY,
            workout_log_id TEXT NOT NULL,
            set_number INTEGER NOT NULL,
            reps INTEGER,
            weight REAL,
            unit TEXT CHECK (unit IN ('kg', 'lbs')),
            notes TEXT,
            created_at TEXT DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')),
            FOREIGN KEY (workout_log_id) REFERENCES workout_logs(id) ON DELETE CASCADE
        );`);

        await runQuery(`CREATE TABLE IF NOT EXISTS client_issues (
            id TEXT PRIMARY KEY,
            reporter_user_id TEXT NOT NULL,
            assigned_trainer_user_id TEXT,
            workout_plan_id TEXT,
            exercise_id TEXT,
            issue_type TEXT NOT NULL CHECK (issue_type IN ('Pain', 'Poor Form', 'Difficulty', 'Other')),
            description TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Resolved')),
            reported_at TEXT DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')),
            resolved_at TEXT,
            created_at TEXT DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')),
            updated_at TEXT DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')),
            FOREIGN KEY (reporter_user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (assigned_trainer_user_id) REFERENCES users(id) ON DELETE SET NULL,
            FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(id) ON DELETE SET NULL,
            FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE SET NULL
        );`);

        await runQuery(`CREATE TABLE IF NOT EXISTS education_articles (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            author TEXT,
            topic TEXT NOT NULL,
            summary TEXT,
            content TEXT,
            thumbnail_url TEXT,
            type TEXT NOT NULL CHECK (type IN ('article', 'video')),
            video_url TEXT,
            published_at TEXT,
            created_at TEXT DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')),
            updated_at TEXT DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))
        );`);

        console.log("Tables created successfully. 👍");

        // --- Seed Data ---
        console.log("Checking for existing data before seeding...");
        const exerciseCount = await new Promise((resolve, reject) => {
            db.get("SELECT COUNT(*) AS count FROM exercises", (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });

        if (exerciseCount === 0) {
            console.log("Seeding exercises data...");
            await runQuery(`INSERT INTO exercises (id, name, description, muscle_group, equipment, difficulty, thumbnail_url, video_url, instructions, tips) VALUES
            ('b19d5c31-c4a0-4a87-9436-c0c1e8d97e74', 'Barbell Bench Press', 'Classic exercise for chest strength.', 'Chest', 'Barbell', 'Intermediate', 'https://via.placeholder.com/60x60?text=BPress', 'http://example.com/videos/bpress.mp4', '["Lie on bench.", "Grip barbell.", "Lower to chest.", "Press up."]', '["Keep feet flat.", "Engage core."]');`);
            await runQuery(`INSERT INTO exercises (id, name, description, muscle_group, equipment, difficulty, thumbnail_url, video_url, instructions, tips) VALUES
            ('a2a3b4c5-d6e7-8f90-1234-567890abcdef', 'Dumbbell Fly', 'Isolates chest muscles.', 'Chest', 'Dumbbells', 'Beginner', 'https://via.placeholder.com/60x60?text=DFly', 'http://example.com/videos/dfly.mp4', '["Lie on bench.", "Hold dumbbells.", "Open arms.", "Bring together."]', '["Slight bend in elbows.", "Control the movement."]');`);
            await runQuery(`INSERT INTO exercises (id, name, description, muscle_group, equipment, difficulty, thumbnail_url, video_url, instructions, tips) VALUES
            ('c0c1d2e3-f4a5-6b7c-8d9e-0f1a2b3c4d5e', 'Push-ups', 'Bodyweight exercise for chest, shoulders, triceps.', 'Chest', 'Bodyweight', 'Beginner', 'https://via.placeholder.com/60x60?text=Pushup', 'http://example.com/videos/pushup.mp4', '["Start in plank.", "Lower chest to floor.", "Push back up."]', '["Keep body straight.", "Engage core."]');`);
            await runQuery(`INSERT INTO exercises (id, name, description, muscle_group, equipment, difficulty, thumbnail_url, video_url, instructions, tips) VALUES
            ('e6f7g8h9-i0j1-k2l3-m4n5-o6p7q8r9s0t1', 'Lat Pulldown', 'Targets the lats and back muscles.', 'Back', 'Machine', 'Intermediate', 'https://via.placeholder.com/60x60?text=LatPD', 'http://example.com/videos/latpd.mp4', '["Sit at machine.", "Grip bar.", "Pull to upper chest.", "Control release."]', '["Lean back slightly.", "Focus on squeezing back."]');`);
            await runQuery(`INSERT INTO exercises (id, name, description, muscle_group, equipment, difficulty, thumbnail_url, video_url, instructions, tips) VALUES
            ('f8f9g0h1-i2j3-k4l5-m6n7-o8p9q0r1s2t3', 'Deadlifts', 'Full body strength exercise.', 'Back', 'Barbell', 'Advanced', 'https://via.placeholder.com/60x60?text=Deadlift', 'http://example.com/videos/deadlift.mp4', '["Stand over bar.", "Hinge at hips.", "Lift with legs.", "Lower with control."]', '["Keep back straight.", "Bar close to body."]');`);
            await runQuery(`INSERT INTO exercises (id, name, description, muscle_group, equipment, difficulty, thumbnail_url, video_url, instructions, tips) VALUES
            ('g2g3h4i5-j6k7-l8m9-n0o1-p2q3r4s5t6u7', 'Barbell Squat', 'Fundamental lower body strength.', 'Legs', 'Barbell', 'Intermediate', 'https://via.placeholder.com/60x60?text=Squat', 'http://example.com/videos/squat.mp4', '["Bar on upper back.", "Feet shoulder-width.", "Squat down.", "Stand up."]', '["Keep chest up.", "Knees out."]');`);
            await runQuery(`INSERT INTO exercises (id, name, description, muscle_group, equipment, difficulty, thumbnail_url, video_url, instructions, tips) VALUES
            ('h0h1i2j3-k4l5-m6n7-o8p9-q0r1s2t3u4v5', 'Leg Press', 'Targets quads, hamstrings, glutes.', 'Legs', 'Machine', 'Beginner', 'https://via.placeholder.com/60x60?text=LP', 'http://example.com/videos/legpress.mp4', '["Sit at machine.", "Feet on platform.", "Press away.", "Bend knees."]', '["Don\\'t lock out knees.", "Control the weight."]');`);
            await runQuery(`INSERT INTO exercises (id, name, description, muscle_group, equipment, difficulty, thumbnail_url, video_url, instructions, tips) VALUES
            ('i9i0j1k2-l3m4-n5o6-p7q8-r9s0t1u2v3w4', 'Bicep Curl', 'Targets the biceps.', 'Arms', 'Dumbbells', 'Beginner', 'https://via.placeholder.com/60x60?text=Bicep', 'http://example.com/videos/bicepcurl.mp4', '["Stand holding dumbbells.", "Curl to shoulders.", "Lower with control."]', '["Keep elbows tucked.", "Avoid swinging."]');`);
            await runQuery(`INSERT INTO exercises (id, name, description, muscle_group, equipment, difficulty, thumbnail_url, video_url, instructions, tips) VALUES
            ('j5j6k7l8-m9n0-o1p2-q3r4-s5t6u7v8w9x0', 'Tricep Extension', 'Targets the triceps.', 'Arms', 'Dumbbells', 'Beginner', 'https://via.placeholder.com/60x60?text=Tricep', 'http://example.com/videos/tricepext.mp4', '["Lie on bench.", "Hold dumbbell overhead.", "Extend arms.", "Lower behind head."]', '["Keep elbows stable.", "Focus on tricep squeeze."]');`);
            await runQuery(`INSERT INTO exercises (id, name, description, muscle_group, equipment, difficulty, thumbnail_url, video_url, instructions, tips) VALUES
            ('k1k2l3m4-n5o6-p7q8-r9s0-t1u2v3w4x5y6', 'Overhead Press', 'Targets shoulders and triceps.', 'Shoulders', 'Barbell', 'Intermediate', 'https://via.placeholder.com/60x60?text=OHP', 'http://example.com/videos/ohp.mp4', '["Bar at chest height.", "Press overhead.", "Lower with control."]', '["Engage core.", "Don\\'t arch back."]');`);
            await runQuery(`INSERT INTO exercises (id, name, description, muscle_group, equipment, difficulty, thumbnail_url, video_url, instructions, tips) VALUES
            ('l7l8m9n0-o1p2-q3r4-s5t6-u7v8w9x0y1z2', 'Lateral Raises', 'Isolates side deltoids.', 'Shoulders', 'Dumbbells', 'Beginner', 'https://via.placeholder.com/60x60?text=LR', 'http://example.com/videos/lateralraise.mp4', '["Hold dumbbells.", "Raise arms to sides.", "Lower slowly."]', '["Slight bend in elbows.", "Don\\'t swing."]');`);
            await runQuery(`INSERT INTO exercises (id, name, description, muscle_group, equipment, difficulty, thumbnail_url, video_url, instructions, tips) VALUES
            ('m3m4n5o6-p7q8-r9s0-t1u2-v3w4x5y6z7a8', 'Plank', 'Core strength and stability.', 'Core', 'Bodyweight', 'Beginner', 'https://via.placeholder.com/60x60?text=Plank', 'http://example.com/videos/plank.mp4', '["Forearms and toes on floor.", "Keep body straight."]', '["Engage abs and glutes.", "Don\\'t sag hips."]');`);
            await runQuery(`INSERT INTO exercises (id, name, description, muscle_group, equipment, difficulty, thumbnail_url, video_url, instructions, tips) VALUES
            ('n9n0o1p2-q3r4-s5t6-u7v8-w9x0y1z2a3b4', 'Russian Twists', 'Targets obliques.', 'Core', 'Bodyweight', 'Beginner', 'https://via.placeholder.com/60x60?text=RT', 'http://example.com/videos/russiantwist.mp4', '["Sit with bent knees.", "Lean back.", "Twist torso."]', '["Control the movement.", "Keep core tight."]');`);
            console.log("Exercises seeded. 💪");
        }

        const articleCount = await new Promise((resolve, reject) => {
            db.get("SELECT COUNT(*) AS count FROM education_articles", (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });

        if (articleCount === 0) {
            console.log("Seeding education articles data...");
            await runQuery(`INSERT INTO education_articles (id, title, author, topic, summary, content, thumbnail_url, type, published_at) VALUES
            ('a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6', 'Getting Started with Strength Training', 'Fitness Expert', 'Training Basics', 'A comprehensive guide for beginners on how to start lifting weights safely and effectively.', '<h2>Introduction to Strength Training</h2><p>Strength training is crucial for overall health...</p>', 'https://via.placeholder.com/300x200?text=Article+Image+1', 'article', '2025-01-10');`);
            await runQuery(`INSERT INTO education_articles (id, title, author, topic, summary, content, thumbnail_url, type, published_at) VALUES
            ('q7r8s9t0-u1v2-w3x4-y5z6-a7b8c9d0e1f2', 'Nutrition Basics: Fueling Your Workouts', 'Dietitian Pro', 'Nutrition', 'Learn about macronutrients, meal timing, and simple strategies for healthy eating.', '<h2>Macronutrients Explained</h2><p>Protein, carbohydrates, and fats are your body''s fuel...</p>', 'https://via.placeholder.com/300x200?text=Article+Image+2', 'article', '2025-02-15');`);
            await runQuery(`INSERT INTO education_articles (id, title, author, topic, summary, content, thumbnail_url, type, published_at) VALUES
            ('g3h4i5j6-k7l8-m9n0-p1q2-r3s4t5u6v7w8', 'The Importance of Active Recovery', 'Recovery Specialist', 'Recovery', 'Discover how light activity can help reduce muscle soreness and improve performance.', '<h2>What is Active Recovery?</h2><p>Active recovery involves low-intensity exercise...</p>', 'https://via.placeholder.com/300x200?text=Article+Image+3', 'article', '2025-03-01');`);
            await runQuery(`INSERT INTO education_articles (id, title, author, topic, summary, content, thumbnail_url, type, video_url, published_at) VALUES
            ('x9y0z1a2-b3c4-d5e6-f7g8-h9i0j1k2l3m4', 'Proper Squat Form Tutorial', 'Trainer Julia', 'Training Basics', 'Video guide for beginners on mastering the correct squat form.', NULL, 'https://via.placeholder.com/300x200?text=Video+Thumbnail+Squat', 'video', 'http://example.com/videos/squat_tutorial.mp4', '2025-04-05');`);
            console.log("Education articles seeded. 📚");
        }

        // Seed some dummy users (optional, but useful for testing login/trainer features)
        const userCount = await new Promise((resolve, reject) => {
            db.get("SELECT COUNT(*) AS count FROM users", (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });

        if (userCount === 0) {
            console.log("Seeding dummy users...");
            const hashedPasswordUser = await bcrypt.hash('password123', 10);
            const hashedPasswordTrainer = await bcrypt.hash('trainerpass', 10);

            // Dummy User (Danny equivalent)
            await runQuery(`INSERT INTO users (id, first_name, last_name, email, password_hash, role) VALUES
            ('b6a8e5f0-d1c2-4b3a-9e0f-1a2b3c4d5e6f', 'Danny', 'Beginner', 'user@example.com', ?, 'user');`, [hashedPasswordUser]);
            // Dummy User Profile (optional, but good to have)
            await runQuery(`INSERT INTO user_profiles (user_id, target_goal) VALUES (?, ?);`, ['b6a8e5f0-d1c2-4b3a-9e0f-1a2b3c4d5e6f', 'Weight Loss']);


            // Dummy Trainer (Julia equivalent)
            await runQuery(`INSERT INTO users (id, first_name, last_name, email, password_hash, role) VALUES
            ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Julia', 'Trainer', 'julia@example.com', ?, 'trainer');`, [hashedPasswordTrainer]);
            // Dummy Trainer (Mark equivalent)
            await runQuery(`INSERT INTO users (id, first_name, last_name, email, password_hash, role) VALUES
            ('c2e1f0a9-b8d7-6c5e-4f3a-2b1c0d9e8f7a', 'Mark', 'Trainer', 'mark@example.com', ?, 'trainer');`, [hashedPasswordTrainer]);
            
            // Create a dummy workout plan for 'user@example.com' assigned by 'julia@example.com'
            const dummyUserPlanId = uuidv4();
            await runQuery(`INSERT INTO workout_plans (id, name, target_goal, difficulty, is_template, created_by_user_id, assigned_to_user_id) VALUES
            (?, 'Danny''s Beginner Plan', 'Weight Loss', 'Beginner', 0, 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'b6a8e5f0-d1c2-4b3a-9e0f-1a2b3c4d5e6f');`, [dummyUserPlanId]);
            
            const dummyUserPlanDayId1 = uuidv4();
            await runQuery(`INSERT INTO workout_plan_days (id, plan_id, day_name, focus, order_in_plan) VALUES
            (?, ?, 'Day 1', 'Full Body Strength', 0);`, [dummyUserPlanDayId1, dummyUserPlanId]);

            await runQuery(`INSERT INTO workout_plan_day_exercises (plan_day_id, exercise_id, sets, reps, notes, order_in_day) VALUES
            (?, 'b19d5c31-c4a0-4a87-9436-c0c1e8d97e74', '3', '8-12', 'Focus on control', 0);`, [dummyUserPlanDayId1]);
            await runQuery(`INSERT INTO workout_plan_day_exercises (plan_day_id, exercise_id, sets, reps, notes, order_in_day) VALUES
            (?, 'g2g3h4i5-j6k7-l8m9-n0o1-p2q3r4s5t6u7', '3', '10-15', 'Go light to learn form', 1);`, [dummyUserPlanDayId1]);
            await runQuery(`INSERT INTO workout_plan_day_exercises (plan_day_id, exercise_id, sets, reps, notes, order_in_day) VALUES
            (?, 'm3m4n5o6-p7q8-r9s0-t1u2-v3w4x5y6z7a8', '3', '60s hold', 'Keep core tight', 2);`, [dummyUserPlanDayId1]);

            const dummyUserPlanDayId2 = uuidv4();
            await runQuery(`INSERT INTO workout_plan_days (id, plan_id, day_name, focus, order_in_plan) VALUES
            (?, ?, 'Day 3', 'Cardio & Abs', 2);`, [dummyUserPlanDayId2, dummyUserPlanId]);
            await runQuery(`INSERT INTO workout_plan_day_exercises (plan_day_id, exercise_id, sets, reps, notes, order_in_day) VALUES
            (?, 'n9n0o1p2-q3r4-s5t6-u7v8-w9x0y1z2a3b4', '3', '15-20/side', 'Slow and controlled', 0);`, [dummyUserPlanDayId2]);


            console.log("Dummy users and plans seeded. 👥");
        }


        console.log("Database initialization and seeding complete. 🎉");

    } catch (error) {
        console.error('FATAL ERROR during database initialization:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        // Close the database connection after all operations
        db.close((err) => {
            if (err) console.error(err.message);
            console.log('Database connection closed.');
            process.exit(0); // Exit successfully after initialization
        });
    }
});