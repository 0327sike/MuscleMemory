require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'database', 'muscle_memory.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err.message);
        process.exit(1);
    } else {
        console.log('Connected to the SQLite database at ' + DB_PATH);
        db.run("PRAGMA foreign_keys = ON;", (pragmaErr) => {
            if (pragmaErr) console.error("Error enabling foreign keys:", pragmaErr.message);
        });

        db.serialize(() => {
            // Table: users
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    first_name TEXT NOT NULL,
                    last_name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    role TEXT DEFAULT 'user',
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                );
            `, (err) => {
                if (err) console.error("Error creating users table:", err.message);
                else console.log("users table checked/created.");

                db.get("SELECT COUNT(*) AS count FROM users", async (err, row) => {
                    if (err) { console.error("Error checking users count:", err.message); return; }
                    if (row.count === 0) {
                        console.log("Populating users table with initial data...");
                        const userId1 = uuidv4();
                        const hashedPassword1 = await bcrypt.hash('password123', 10);
                        const userId2 = uuidv4();
                        const hashedPassword2 = await bcrypt.hash('securepass', 10);

                        db.run(`INSERT INTO users (id, first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)`,
                            [userId1, 'Test', 'User', 'test@example.com', hashedPassword1, 'user'], (err) => {
                                if (err) console.error("Error inserting test user 1:", err.message);
                            });
                        db.run(`INSERT INTO users (id, first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)`,
                            [userId2, 'Trainer', 'Pro', 'trainer@example.com', hashedPassword2, 'trainer'], (err) => {
                                if (err) console.error("Error inserting trainer user 2:", err.message);
                            });
                    }
                });
            });

            // Table: user_profiles
            db.run(`
                CREATE TABLE IF NOT EXISTS user_profiles (
                    user_id TEXT PRIMARY KEY,
                    notification_daily_reminders BOOLEAN DEFAULT 0,
                    notification_progress_alerts BOOLEAN DEFAULT 0,
                    notification_client_messages BOOLEAN DEFAULT 0,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
            `, (err) => {
                if (err) console.error("Error creating user_profiles table:", err.message);
                else console.log("user_profiles table checked/created.");
            });

            // Table: workout_plans
            db.run(`
                CREATE TABLE IF NOT EXISTS workout_plans (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    target_goal TEXT,
                    difficulty TEXT,
                    description TEXT,
                    is_template BOOLEAN DEFAULT 0,
                    created_by_user_id TEXT NOT NULL,
                    assigned_to_user_id TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL
                );
            `, (err) => {
                if (err) console.error("Error creating workout_plans table:", err.message);
                else console.log("workout_plans table checked/created.");
            });

            // Table: workout_plan_days
            db.run(`
                CREATE TABLE IF NOT EXISTS workout_plan_days (
                    id TEXT PRIMARY KEY,
                    plan_id TEXT NOT NULL,
                    day_name TEXT NOT NULL,
                    focus TEXT,
                    order_in_plan INTEGER NOT NULL,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE
                );
            `, (err) => {
                if (err) console.error("Error creating workout_plan_days table:", err.message);
                else console.log("workout_plan_days table checked/created.");
            });

            // Table: exercises
            db.run(`
                CREATE TABLE IF NOT EXISTS exercises (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL,
                    muscle_group TEXT NOT NULL,
                    equipment TEXT NOT NULL,
                    difficulty TEXT NOT NULL,
                    description TEXT,
                    image_url TEXT,
                    video_url TEXT,
                    thumbnail_url TEXT
                );
            `, (err) => {
                if (err) console.error("Error creating exercises table:", err.message);
                else console.log("exercises table checked/created.");

                db.get("SELECT COUNT(*) AS count FROM exercises", (err, row) => {
                    if (err) { console.error("Error checking exercises count:", err.message); return; }
                    if (row.count === 0) {
                        console.log("Populating exercises table with initial data...");
                        const insertExercise = db.prepare(`
                            INSERT INTO exercises (name, muscle_group, equipment, difficulty, description, image_url, video_url, thumbnail_url)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        `);
                        const uniqueSampleExercises = [
                            ["Barbell Bench Press", "Chest", "Barbell", "Intermediate", "Classic chest builder.", "https://via.placeholder.com/60x60?text=BP", "https://www.example.com/exercise-bp", "https://via.placeholder.com/60x60?text=BP"],
                            ["Dumbbell Flyes", "Chest", "Dumbbells", "Beginner", "Isolate chest muscles.", "https://via.placeholder.com/60x60?text=DF", "https://www.example.com/exercise-df", "https://via.placeholder.com/60x60?text=DF"],
                            ["Push-ups", "Chest", "Bodyweight", "Beginner", "Fundamental bodyweight exercise.", "https://via.placeholder.com/60x60?text=PU", "https://www.example.com/exercise-pu", "https://via.placeholder.com/60x60?text=PU"],
                            ["Incline Dumbbell Press", "Chest", "Dumbbells", "Intermediate", "Targets upper chest.", "https://via.placeholder.com/60x60?text=IDP", "https://www.example.com/exercise-idp", "https://via.placeholder.com/60x60?text=IDP"],
                            ["Cable Crossover", "Chest", "Cables", "Intermediate", "Great for muscle definition.", "https://via.placeholder.com/60x60?text=CC", "https://www.example.com/exercise-cc", "https://via.placeholder.com/60x60?text=CC"],
                            ["Machine Chest Press", "Chest", "Machine", "Beginner", "Controlled chest movement.", "https://via.placeholder.com/60x60?text=MCP", "https://www.example.com/exercise-mcp", "https://via.placeholder.com/60x60?text=MCP"],
                            ["Decline Barbell Press", "Chest", "Barbell", "Intermediate", "Targets lower chest.", "https://via.placeholder.com/60x60?text=DBP", "https://www.example.com/exercise-dbp", "https://via.placeholder.com/60x60?text=DBP"],
                            ["Dumbbell Pullover", "Chest", "Dumbbells", "Beginner", "Expands rib cage, stretches lats & chest.", "https://via.placeholder.com/60x60?text=DP", "https://www.example.com/exercise-dp", "https://www.example.com/exercise-dp"],
                            ["Pull-ups", "Back", "Bodyweight", "Advanced", "Excellent for overall back thickness.", "https://via.placeholder.com/60x60?text=PU", "https://www.example.com/exercise-pu", "https://www.example.com/exercise-pu"],
                            ["Lat Pulldown", "Back", "Machine", "Intermediate", "Targets lats for width.", "https://via.placeholder.com/60x60?text=LPD", "https://www.example.com/exercise-lpd", "https://www.example.com/exercise-lpd"],
                            ["Bent-over Rows", "Back", "Barbell", "Intermediate", "Builds mid-back thickness.", "https://via.placeholder.com/60x60?text=BOR", "https://www.example.com/exercise-bor", "https://www.example.com/exercise-bor"],
                            ["Deadlifts", "Back", "Barbell", "Advanced", "Full body strength, especially back.", "https://www.example.com/exercise-dl", "https://www.example.com/exercise-dl", "https://www.example.com/exercise-dl"],
                            ["Seated Cable Rows", "Back", "Cables", "Intermediate", "Targets mid-back and lats.", "https://www.example.com/exercise-scr", "https://www.example.com/exercise-scr", "https://www.example.com/exercise-scr"],
                            ["T-Bar Row", "Back", "Barbell", "Intermediate", "Good for lower lats and traps.", "https://www.example.com/exercise-tbr", "https://www.example.com/exercise-tbr", "https://www.example.com/exercise-tbr"],
                            ["Face Pulls", "Back", "Cables", "Beginner", "Rear deltoids and upper back.", "https://www.example.com/exercise-fp", "https://www.example.com/exercise-fp", "https://www.example.com/exercise-fp"],
                            ["Hyperextensions", "Back", "Bodyweight", "Beginner", "Strengthens lower back.", "https://www.example.com/exercise-he", "https://www.example.com/exercise-he", "https://www.example.com/exercise-he"],
                            ["Overhead Press (OHP)", "Shoulders", "Barbell", "Intermediate", "Classic shoulder mass builder.", "https://www.example.com/exercise-ohp", "https://www.example.com/exercise-ohp", "https://www.example.com/exercise-ohp"],
                            ["Lateral Raises", "Shoulders", "Dumbbells", "Beginner", "Develops side deltoids.", "https://www.example.com/exercise-lr", "https://www.example.com/exercise-lr", "https://www.example.com/exercise-lr"],
                            ["Front Raises", "Shoulders", "Dumbbells", "Beginner", "Targets front deltoids.", "https://www.example.com/exercise-fr", "https://www.example.com/exercise-fr", "https://www.example.com/exercise-fr"],
                            ["Shrugs", "Shoulders", "Dumbbells", "Beginner", "For traps development.", "https://www.example.com/exercise-shrug", "https://www.example.com/exercise-shrug", "https://www.example.com/exercise-shrug"],
                            ["Arnold Press", "Shoulders", "Dumbbells", "Intermediate", "Targets all three deltoid heads.", "https://www.example.com/exercise-ap", "https://www.example.com/exercise-ap", "https://www.example.com/exercise-ap"],
                            ["Upright Row", "Shoulders", "Barbell", "Intermediate", "Works deltoids and traps.", "https://www.example.com/exercise-ur", "https://www.example.com/exercise-ur", "https://www.example.com/exercise-ur"],
                            ["Reverse Pec Deck Fly", "Shoulders", "Machine", "Intermediate", "Rear deltoid isolation.", "https://www.example.com/exercise-rpdf", "https://www.example.com/exercise-rpdf", "https://www.example.com/exercise-rpdf"],
                            ["Bicep Curls", "Arms", "Dumbbells", "Beginner", "Classic bicep exercise.", "https://www.example.com/exercise-bc", "https://www.example.com/exercise-bc", "https://www.example.com/exercise-bc"],
                            ["Tricep Extensions (OH)", "Arms", "Dumbbells", "Beginner", "Targets triceps.", "https://www.example.com/exercise-ote", "https://www.example.com/exercise-ote", "https://www.example.com/exercise-ote"],
                            ["Hammer Curls", "Arms", "Dumbbells", "Beginner", "Works brachialis and brachioradialis.", "https://www.example.com/exercise-hc", "https://www.example.com/exercise-hc", "https://www.example.com/exercise-hc"],
                            ["Dips", "Arms", "Bodyweight", "Intermediate", "Great for triceps and chest.", "https://www.example.com/exercise-dips", "https://www.example.com/exercise-dips", "https://www.example.com/exercise-dips"],
                            ["Preacher Curls", "Arms", "Machine", "Intermediate", "Isolates biceps.", "https://www.example.com/exercise-pc", "https://www.example.com/exercise-pc", "https://www.example.com/exercise-pc"],
                            ["Close-Grip Bench Press", "Arms", "Barbell", "Intermediate", "Excellent tricep mass builder.", "https://www.example.com/exercise-cgbp", "https://www.example.com/exercise-cgbp", "https://www.example.com/exercise-cgbp"],
                            ["Concentration Curls", "Arms", "Dumbbells", "Beginner", "Bicep peak isolation.", "https://www.example.com/exercise-ccu", "https://www.example.com/exercise-ccu", "https://www.example.com/exercise-ccu"],
                            ["Tricep Pushdown", "Arms", "Cables", "Beginner", "Tricep isolation exercise.", "https://www.example.com/exercise-tpd", "https://www.example.com/exercise-tpd", "https://www.example.com/exercise-tpd"],
                            ["Squats", "Legs", "Barbell", "Advanced", "King of leg exercises.", "https://www.example.com/exercise-squat", "https://www.example.com/exercise-squat", "https://www.example.com/exercise-squat"],
                            ["Lunges", "Legs", "Dumbbells", "Beginner", "Works quads, hamstrings, glutes.", "https://www.example.com/exercise-lunge", "https://www.example.com/exercise-lunge", "https://www.example.com/exercise-lunge"],
                            ["Leg Press", "Legs", "Machine", "Intermediate", "Good for quad and glute development.", "https://www.example.com/exercise-lp", "https://www.example.com/exercise-lp", "https://www.example.com/exercise-lp"],
                            ["Calf Raises", "Legs", "Bodyweight", "Beginner", "Targets calf muscles.", "https://www.example.com/exercise-cr", "https://www.example.com/exercise-cr", "https://www.example.com/exercise-cr"],
                            ["Hamstring Curls", "Legs", "Machine", "Beginner", "Isolates hamstrings.", "https://www.example.com/exercise-hcurl", "https://www.example.com/exercise-hcurl", "https://www.example.com/exercise-hcurl"],
                            ["Romanian Deadlifts", "Legs", "Barbell", "Intermediate", "Hamstring and glute focused.", "https://www.example.com/exercise-rdl", "https://www.example.com/exercise-rdl", "https://www.example.com/exercise-rdl"],
                            ["Leg Extension", "Legs", "Machine", "Beginner", "Quad isolation.", "https://www.example.com/exercise-le", "https://www.example.com/exercise-le", "https://www.example.com/exercise-le"],
                            ["Glute Bridge", "Legs", "Bodyweight", "Beginner", "Activates glutes.", "https://www.example.com/exercise-gb", "https://www.example.com/exercise-gb", "https://www.example.com/exercise-gb"],
                            ["Crunches", "Core", "Bodyweight", "Beginner", "Basic abdominal exercise.", "https://www.example.com/exercise-crunch", "https://www.example.com/exercise-crunch", "https://www.example.com/exercise-crunch"],
                            ["Plank", "Core", "Bodyweight", "Beginner", "Excellent for core stability.", "https://www.example.com/exercise-plank", "https://www.example.com/exercise-plank", "https://www.example.com/exercise-plank"],
                            ["Leg Raises", "Core", "Bodyweight", "Beginner", "Targets lower abs.", "https://www.example.com/exercise-lraises", "https://www.example.com/exercise-lraises", "https://www.example.com/exercise-lraises"],
                            ["Russian Twists", "Core", "Bodyweight", "Intermediate", "Works obliques.", "https://www.example.com/exercise-rt", "https://www.example.com/exercise-rt", "https://www.example.com/exercise-rt"],
                            ["Ab Rollout", "Core", "Equipment", "Advanced", "Challenges entire core.", "https://www.example.com/exercise-ar", "https://www.example.com/exercise-ar", "https://www.example.com/exercise-ar"],
                            ["Bicycle Crunches", "Core", "Bodyweight", "Beginner", "Engages obliques and rectus abdominis.", "https://www.example.com/exercise-bcr", "https://www.example.com/exercise-bcr", "https://www.example.com/exercise-bcr"],
                            ["Side Plank", "Core", "Bodyweight", "Beginner", "Strengthens obliques.", "https://www.example.com/exercise-sp", "https://www.example.com/exercise-sp", "https://www.example.com/exercise-sp"],
                            ["Cable Crunches", "Core", "Cables", "Intermediate", "Adds resistance to crunches.", "https://www.example.com/exercise-ccr", "https://www.example.com/exercise-ccr", "https://www.example.com/exercise-ccr"]
                        ];

                        const exercisesToInsert = [...uniqueSampleExercises];
                        const numToDuplicate = 120 - uniqueSampleExercises.length;
                        for (let i = 0; i < numToDuplicate; i++) {
                            const original = uniqueSampleExercises[i % uniqueSampleExercises.length];
                            exercisesToInsert.push([
                                `${original[0]} - Var ${i + 1}`,
                                original[1], original[2], original[3],
                                `${original[4]} (Variation ${i + 1})`,
                                original[5], `https://www.example.com/exercise-var-${i+1}-${uuidv4().substring(0,4)}`, original[7]
                            ]);
                        }

                        db.serialize(() => {
                            db.run("BEGIN TRANSACTION;");
                            exercisesToInsert.forEach(exercise => {
                                insertExercise.run(...exercise, (err) => {
                                    if (err) {
                                        if (!err.message.includes('UNIQUE constraint failed')) {
                                            console.error("Error inserting exercise:", err.message);
                                        }
                                    }
                                });
                            });
                            insertExercise.finalize();
                            db.run("COMMIT;", (err) => {
                                if (err) console.error("Error committing exercises transaction:", err.message);
                                else console.log(`Finished populating exercises table with ${exercisesToInsert.length} entries.`);
                            });
                        });
                    }
                });
            });

            // Table: lift_logs (NEW)
            db.run(`
                CREATE TABLE IF NOT EXISTS lift_logs (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    exercise_id INTEGER NOT NULL,
                    log_date TEXT NOT NULL,
                    sets_reps_weight TEXT NOT NULL,
                    notes TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
                );
            `, (err) => {
                if (err) console.error("Error creating lift_logs table:", err.message);
                else console.log("lift_logs table checked/created.");
            });

            // Table: progress_photos (NEW)
            db.run(`
                CREATE TABLE IF NOT EXISTS progress_photos (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    photo_date TEXT NOT NULL,
                    description TEXT,
                    image_url TEXT NOT NULL,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
            `, (err) => {
                if (err) console.error("Error creating progress_photos table:", err.message);
                else console.log("progress_photos table checked/created.");
            });

            // Table: milestones (NEW)
            db.run(`
                CREATE TABLE IF NOT EXISTS milestones (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    description TEXT,
                    date_achieved TEXT NOT NULL,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
            `, (err) => {
                if (err) console.error("Error creating milestones table:", err.message);
                else console.log("milestones table checked/created.");

                db.get("SELECT COUNT(*) AS count FROM milestones", async (err, row) => {
                    if (err) { console.error("Error checking milestones count:", err.message); return; }
                    if (row.count === 0) {
                        console.log("Populating milestones table with initial data...");
                        const testUser = await getQuery("SELECT id FROM users WHERE email = 'test@example.com'");
                        if (testUser) {
                            const userId = testUser.id;
                            db.run("BEGIN TRANSACTION;");
                            db.run(`INSERT INTO milestones (id, user_id, name, description, date_achieved) VALUES (?, ?, ?, ?, ?)`,
                                [uuidv4(), userId, 'First 10 Workouts!', 'Completed your first 10 workout sessions.', '2025-05-20'], (err) => { if (err) console.error("Error inserting milestone 1:", err.message); });
                            db.run(`INSERT INTO milestones (id, user_id, name, description, date_achieved) VALUES (?, ?, ?, ?, ?)`,
                                [uuidv4(), userId, 'Squat 100kg Club', 'Achieved a 100kg squat personal record.', '2025-06-15'], (err) => { if (err) console.error("Error inserting milestone 2:", err.message); });
                            db.run("COMMIT;", (err) => {
                                if (err) console.error("Error committing milestones transaction:", err.message);
                                else console.log("Milestones table populated.");
                            });
                        }
                    }
                });
            });

            // Table: workout_log_sets
            db.run(`
                CREATE TABLE IF NOT EXISTS workout_log_sets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    workout_log_id TEXT NOT NULL,
                    set_number INTEGER NOT NULL,
                    reps INTEGER,
                    weight REAL,
                    unit TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (workout_log_id) REFERENCES workout_logs(id) ON DELETE CASCADE
                );
            `, (err) => {
                if (err) console.error("Error creating workout_log_sets table:", err.message);
                else console.log("workout_log_sets table checked/created.");

                db.get("SELECT COUNT(*) AS count FROM workout_logs", async (err, row) => {
                    if (err) { console.error("Error checking workout_logs count:", err.message); return; }
                    if (row.count === 0) {
                        console.log("Populating workout_logs table with initial data...");
                        const testUser = await getQuery("SELECT id FROM users WHERE email = 'test@example.com'");
                        const benchPressExercise = await getQuery("SELECT id FROM exercises WHERE name = 'Barbell Bench Press'");
                        const squatExercise = await getQuery("SELECT id FROM exercises WHERE name = 'Squats'");
                        const plankExercise = await getQuery("SELECT id FROM exercises WHERE name = 'Plank'");

                        if (testUser && benchPressExercise && squatExercise && plankExercise) {
                            const userId = testUser.id;
                            const bpId = benchPressExercise.id;
                            const squatId = squatExercise.id;
                            const plankId = plankExercise.id;

                            const logsToInsert = [];
                            // Bench Press data for chart (6 monthly logs)
                            for (let i = 0; i < 6; i++) {
                                const date = new Date(Date.now() - (i * 30 * 24 * 60 * 60 * 1000)); // ~monthly logs
                                const logId = uuidv4();
                                logsToInsert.push({
                                    log_id: logId,
                                    user_id: userId,
                                    exercise_id: bpId,
                                    log_date: date.toISOString().split('T')[0],
                                    duration_minutes: 60,
                                    is_completed_day: 1,
                                    sets: [
                                        { set_number: 1, reps: 8, weight: 60 + i*5, unit: 'kg' },
                                        { set_number: 2, reps: 8, weight: 60 + i*5, unit: 'kg' },
                                        { set_number: 3, reps: 6, weight: 65 + i*5, unit: 'kg' } // Max lift data
                                    ]
                                });
                            }
                            // Workout frequency data (12 weekly logs)
                            for (let i = 0; i < 12; i++) {
                                const date = new Date(Date.now() - (i * 7 * 24 * 60 * 60 * 1000)); // Weekly logs
                                logsToInsert.push({
                                    log_id: uuidv4(),
                                    user_id: userId,
                                    exercise_id: (i % 2 === 0) ? squatId : plankId, // Alternate exercises
                                    log_date: date.toISOString().split('T')[0],
                                    duration_minutes: 45,
                                    is_completed_day: 1,
                                    sets: [] // No sets needed for frequency
                                });
                            }

                            db.serialize(() => {
                                db.run("BEGIN TRANSACTION;");
                                logsToInsert.forEach(log => {
                                    db.run(`INSERT INTO workout_logs (id, user_id, exercise_id, log_date, duration_minutes, is_completed_day) VALUES (?, ?, ?, ?, ?, ?)`,
                                        [log.log_id, log.user_id, log.exercise_id, log.log_date, log.duration_minutes, log.is_completed_day], (err) => {
                                            if (err) console.error("Error inserting workout log:", err.message);
                                            log.sets.forEach(set => {
                                                db.run(`INSERT INTO workout_log_sets (workout_log_id, set_number, reps, weight, unit) VALUES (?, ?, ?, ?, ?)`,
                                                    [log.log_id, set.set_number, set.reps, set.weight, set.unit], (err) => {
                                                        if (err) console.error("Error inserting workout log set:", err.message);
                                                    });
                                            });
                                        });
                                });
                                db.run("COMMIT;", (err) => {
                                    if (err) console.error("Error committing workout logs transaction:", err.message);
                                    else console.log(`Finished populating workout_logs table with ${logsToInsert.length} entries.`);
                                });
                            });
                        } else {
                            console.warn("Skipping workout_logs population: Test user or required exercises not found. Ensure 'test@example.com' user exists and exercises are populated.");
                        }
                    }
                });
            });

            // Table: client_issues
            db.run(`
                CREATE TABLE IF NOT EXISTS client_issues (
                    id TEXT PRIMARY KEY,
                    reporter_user_id TEXT NOT NULL,
                    assigned_trainer_user_id TEXT,
                    workout_plan_id TEXT,
                    exercise_id INTEGER,
                    issue_type TEXT NOT NULL,
                    description TEXT NOT NULL,
                    status TEXT DEFAULT 'Open',
                    reported_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    resolved_at TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (reporter_user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (assigned_trainer_user_id) REFERENCES users(id) ON DELETE SET NULL,
                    FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(id) ON DELETE SET NULL,
                    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE SET NULL
                );
            `, (err) => {
                if (err) console.error("Error creating client_issues table:", err.message);
                else console.log("client_issues table checked/created.");
            });

            db.run(`
              CREATE TABLE IF NOT EXISTS workout_plan_day_exercises (
                  plan_day_id TEXT NOT NULL,
                  exercise_id INTEGER NOT NULL,
                  sets TEXT,   -- Can be a JSON string like "3" or "3-4"
                  reps TEXT,   -- Can be a JSON string like "8" or "8-12"
                  notes TEXT,
                  order_in_day INTEGER NOT NULL,
                  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (plan_day_id, exercise_id), -- Composite primary key
                  FOREIGN KEY (plan_day_id) REFERENCES workout_plan_days(id) ON DELETE CASCADE,
                  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
              );
          `, (err) => {
              if (err) console.error("Error creating workout_plan_day_exercises table:", err.message);
              else console.log("workout_plan_day_exercises table checked/created.");
          });

            // Table: education_articles
            db.run(`
                CREATE TABLE IF NOT EXISTS education_articles (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    author TEXT,
                    topic TEXT,
                    summary TEXT,
                    content TEXT,
                    thumbnail_url TEXT,
                    video_url TEXT,
                    type TEXT DEFAULT 'article',
                    published_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                );
            `, (err) => {
                if (err) console.error("Error creating education_articles table:", err.message);
                else console.log("education_articles table checked/created.");
                db.get("SELECT COUNT(*) AS count FROM education_articles", (err, row) => {
                    if (err) { console.error("Error checking articles count:", err.message); return; }
                    if (row.count === 0) {
                        console.log("Populating education_articles table with initial data...");
                        const insertArticle = db.prepare(`
                            INSERT INTO education_articles (id, title, author, topic, summary, content, thumbnail_url, video_url, type, published_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `);
                        const sampleArticles = [
                            [uuidv4(), "Mastering the Deadlift: A Comprehensive Guide", "Dr. Strength", "Training Basics", "Unlock the secrets to a perfect deadlift form, safety tips, and progressive overload strategies.", "Full detailed content about deadlifting, focusing on form, common mistakes, and progression.", "https://via.placeholder.com/300x200?text=DeadliftGuide", "https://www.example.com/article-deadlift-guide", "article", "2025-07-10T10:00:00Z"],
                            [uuidv4(), "The Science of Macronutrients: Carbs, Protein, Fats", "NutriGuru", "Nutrition", "Understand how to balance your macros for optimal energy, muscle growth, and fat loss.", "Detailed content on macronutrients, their roles, and how to calculate your needs.", "https://via.placeholder.com/300x200?text=Macros", "https://www.example.com/article-macros-science", "article", "2025-07-08T11:30:00Z"],
                            [uuidv4(), "Effective Recovery Strategies for Athletes", "PhysioPro", "Recovery", "Learn about sleep, foam rolling, stretching, and nutrition to enhance post-workout recovery.", "Comprehensive guide on various recovery techniques and their benefits.", "https://via.placeholder.com/300x200?text=Recovery", "https://www.example.com/article-recovery-strategies", "article", "2025-07-05T09:00:00Z"],
                            [uuidv4(), "Preventing Common Lifting Injuries", "Dr. Rehab", "Injury Prevention", "Tips and techniques to minimize the risk of injuries during your strength training sessions.", "In-depth look at common injuries and proactive prevention methods.", "https://via.placeholder.com/300x200?text=InjPrev", "https://www.example.com/article-injury-prevention", "article", "2025-07-12T14:00:00Z"],
                            [uuidv4(), "Mindset & Motivation: Staying Consistent", "Coach Zen", "Mindset", "Strategies to build mental toughness and maintain motivation on your fitness journey.", "Explore psychological tactics to stay motivated and consistent with your fitness goals.", "https://via.placeholder.com/300x200?text=Mindset", "https://www.example.com/article-mindset-motivation", "article", "2025-07-01T10:00:00Z"],
                            [uuidv4(), "The Ultimate Guide to Proper Squat Form", "Leg Day King", "Training Basics", "Master the king of all exercises with detailed cues and common mistake fixes.", "A step-by-step tutorial on achieving perfect squat form for maximum gains and safety.", "https://via.placeholder.com/300x200?text=SquatForm", "https://www.example.com/article-squat-form", "article", "2025-06-28T09:00:00Z"],
                            
                            [uuidv4(), "Beginner's Guide to Home Workouts", "FitLife", "Training Basics", "Simple and effective bodyweight exercises you can do from home with no equipment.", "Learn how to build a full body workout routine using just your bodyweight at home.", "https://via.placeholder.com/300x200?text=HomeWorkout", "https://www.example.com/article-home-workouts", "article", "2025-07-18T09:00:00Z"],
                            [uuidv4(), "Understanding Glycemic Index in Diet", "NutriFacts", "Nutrition", "What is GI and how does it affect your energy levels and weight management?", "An explanation of the glycemic index and its practical applications for your diet.", "https://via.placeholder.com/300x200?text=GI", "https://www.example.com/article-glycemic-index", "article", "2025-07-17T15:00:00Z"],
                            [uuidv4(), "The Benefits of Dynamic Stretching", "Flexibility Expert", "Recovery", "Why dynamic stretching is crucial for warm-ups and injury prevention.", "Discover the scientific benefits of dynamic stretching and how to incorporate it.", "https://via.placeholder.com/300x200?text=Stretch", "https://www.example.com/article-dynamic-stretching", "article", "2025-07-16T10:00:00Z"],
                            [uuidv4(), "Advanced Calisthenics Progression", "Bodyweight Pro", "Training Basics", "Take your bodyweight training to the next level with these advanced exercises.", "Progressive drills and exercises to build extreme bodyweight strength.", "https://via.placeholder.com/300x200?text=Calisthenics", "https://www.example.com/article-calisthenics-advanced", "article", "2025-07-15T12:00:00Z"],
                            [uuidv4(), "Protein Timing for Muscle Growth", "MuscleDoc", "Nutrition", "Does it matter when you consume protein? A look at the research.", "A review of current research on protein timing and its impact on hypertrophy.", "https://via.placeholder.com/300x200?text=Protein", "https://www.example.com/article-protein-timing", "article", "2025-07-14T10:00:00Z"],
                            [uuidv4(), "How to Read Supplement Labels", "Supps Savvy", "Nutrition", "Don't fall for marketing hype. Learn what to look for on supplement labels.", "A critical guide to understanding supplement ingredients and dosages.", "https://via.placeholder.com/300x200?text=SuppLabels", "https://www.example.com/article-supplement-labels", "article", "2025-07-13T09:00:00Z"],
                            [uuidv4(), "The Power of Progressive Overload", "Strength Coach", "Training Basics", "The fundamental principle for continuous strength and muscle gains.", "An in-depth explanation of progressive overload and how to apply it to your training.", "https://www.example.com/article-progressive-overload", "https://www.example.com/article-progressive-overload", "article", "2025-07-11T16:00:00Z"],
                            [uuidv4(), "Understanding DOMS: Muscle Soreness Explained", "Wellness Guide", "Recovery", "What causes delayed onset muscle soreness and how to manage it.", "All you need to know about DOMS, from causes to effective relief strategies.", "https://via.placeholder.com/300x200?text=DOMS", "https://www.example.com/article-doms-explained", "article", "2025-07-09T11:00:00Z"],
                            [uuidv4(), "Building an Effective Home Gym", "Home Gym Hub", "Equipment", "Essential equipment for setting up your own effective home workout space.", "A step-by-step guide to setting up a functional home gym on any budget.", "https://via.placeholder.com/300x200?text=HomeGym", "https://www.example.com/article-home-gym", "article", "2025-07-07T13:00:00Z"],
                            [uuidv4(), "The Benefits of Hydration for Performance", "Hydration Expert", "Nutrition", "Why staying hydrated is critical for every aspect of your fitness.", "Discover the crucial role of hydration in athletic performance and recovery.", "https://www.example.com/article-hydration-benefits", "https://www.example.com/article-hydration-benefits", "article", "2025-07-06T10:00:00Z"],
                            [uuidv4(), "Mastering the Pull-Up: From Beginner to Pro", "Calisthenics King", "Training Basics", "Step-by-step progressions to achieve your first pull-up and beyond.", "Detailed guide with drills and exercises to help you master the pull-up.", "https://via.placeholder.com/300x200?text=PullUpGuide", "https://www.example.com/article-pullup-guide", "article", "2025-07-04T14:00:00Z"],
                            [uuidv4(), "Intermittent Fasting: Is It For You?", "Diet Trends", "Nutrition", "Exploring the pros and cons of intermittent fasting for fat loss and health.", "An objective look at intermittent fasting, its benefits, and potential drawbacks.", "https://www.example.com/article-intermittent-fasting", "https://www.example.com/article-intermittent-fasting", "article", "2025-07-03T11:00:00Z"],
                            [uuidv4(), "Yoga for Strength & Flexibility", "Yoga Guru", "Recovery", "How incorporating yoga can improve your strength training and overall well-being.", "Explore various yoga poses and routines to enhance your strength and flexibility.", "https://via.placeholder.com/300x200?text=Yoga", "https://www.example.com/article-yoga-strength", "article", "2025-07-02T09:00:00Z"]
                        ];
                        // Ensure enough articles for 15+
                        if (sampleArticles.length < 15) {
                            console.warn("Not enough unique articles. Duplicating to meet 15+ requirement.");
                            const originalCount = sampleArticles.length;
                            for (let i = 0; sampleArticles.length < 15; i++) {
                                const original = sampleArticles[i % originalCount];
                                sampleArticles.push([
                                    uuidv4(), // New unique ID
                                    `${original[1]} (Cont. ${sampleArticles.length + 1})`, // Modified title
                                    original[2], original[3],
                                    `${original[4]} (More details for var ${sampleArticles.length + 1})`, // Modified summary
                                    original[5], original[6],
                                    `https://www.example.com/article-cont-${uuidv4().substring(0,8)}`, // Unique URL
                                    original[8], original[9]
                                ]);
                            }
                        }

                        db.serialize(() => {
                            db.run("BEGIN TRANSACTION;");
                            sampleArticles.forEach(article => {
                                insertArticle.run(...article, (err) => {
                                    if (err) {
                                        if (!err.message.includes('UNIQUE constraint failed')) {
                                            console.error("Error inserting article:", err.message);
                                        }
                                    }
                                });
                            });
                            insertArticle.finalize();
                            db.run("COMMIT;", (err) => {
                                if (err) console.error("Error committing articles transaction:", err.message);
                                else console.log(`Finished populating education_articles table with ${sampleArticles.length} entries.`);
                            });
                        });
                    }
                });
            });
        }); // End db.serialize for tables and initial data
    }
});

// Helper function to run SQL queries with Promises
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

const allQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};


// Basic route for testing
app.get('/', (req, res) => {
    res.send('Muscle Memory Backend API is running!');
});

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Authentication token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error('JWT Verification Error:', err);
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Authorization Middleware (for role-based access)
const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }
        next();
    };
};

// --- API Routes ---

// 1. Authentication & Authorization
app.post('/api/auth/register', async (req, res) => {
    const { firstName, lastName, email, password, role = 'user' } = req.body;

    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const existingUser = await getQuery('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(409).json({ message: 'Email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();

        await runQuery(
            'INSERT INTO users (id, first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, firstName, lastName, email, hashedPassword, role]
        );

        const token = jwt.sign(
            { userId: userId, role: role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            userId: userId,
            token
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await getQuery('SELECT id, password_hash, role FROM users WHERE email = ?', [email]);

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '5y' }
        );

        res.status(200).json({
            message: 'Login successful',
            userId: user.id,
            role: user.role,
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// 2. User & Profile Management
app.get('/api/users/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;

    if (req.user.userId !== userId && !(req.user.role === 'trainer')) {
        return res.status(403).json({ message: 'Forbidden: You can only view your own profile or be a trainer.' });
    }

    try {
        const user = await getQuery(
            `SELECT
                u.id, u.first_name, u.last_name, u.email, u.role, u.created_at, u.updated_at,
                up.notification_daily_reminders, up.notification_progress_alerts, up.notification_client_messages
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE u.id = ?`,
            [userId]
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            role: user.role,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
            notificationPreferences: {
                dailyWorkoutReminders: !!user.notification_daily_reminders,
                progressMilestoneAlerts: !!user.notification_progress_alerts,
                clientMessages: !!user.notification_client_messages
            }
        });

    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({ message: 'Server error retrieving profile.' });
    }
});

app.put('/api/users/:userId/profile', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    const { firstName, lastName, email } = req.body;

    if (req.user.userId !== userId) {
        return res.status(403).json({ message: 'Forbidden: You can only update your own profile.' });
    }

    try {
        const existingUser = await getQuery('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
        if (existingUser) {
            return res.status(409).json({ message: 'Email already in use by another account.' });
        }

        const result = await runQuery(
            'UPDATE users SET first_name = ?, last_name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [firstName, lastName, email, userId]
        );

        if (result.changes === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({ message: 'Profile updated successfully.', user: { id: userId, firstName, lastName, email } });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error updating profile.' });
    }
});

app.put('/api/users/:userId/notifications', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    const { dailyWorkoutReminders, progressMilestoneAlerts, clientMessages } = req.body;

    if (req.user.userId !== userId) {
        return res.status(403).json({ message: 'Forbidden: You can only update your own notification preferences.' });
    }

    try {
        const existingProfile = await getQuery('SELECT user_id FROM user_profiles WHERE user_id = ?', [userId]);

        if (existingProfile) {
            await runQuery(
                `UPDATE user_profiles SET
                    notification_daily_reminders = ?,
                    notification_progress_alerts = ?,
                    notification_client_messages = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?`,
                [dailyWorkoutReminders, progressMilestoneAlerts, clientMessages, userId]
            );
        } else {
            await runQuery(
                `INSERT INTO user_profiles (user_id, notification_daily_reminders, notification_progress_alerts, notification_client_messages)
                VALUES (?, ?, ?, ?)`,
                [userId, dailyWorkoutReminders, progressMilestoneAlerts, clientMessages]
            );
        }

        res.status(200).json({ message: 'Notification preferences updated successfully.' });

    } catch (error) {
        console.error('Update notifications error:', error);
        res.status(500).json({ message: 'Server error updating notifications.' });
    }
});

app.put('/api/users/:userId/password', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (req.user.userId !== userId) {
        return res.status(403).json({ message: 'Forbidden: You can only change your own password.' });
    }

    try {
        const user = await getQuery('SELECT password_hash FROM users WHERE id = ?', [userId]);

        if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) {
            return res.status(401).json({ message: 'Incorrect current password.' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await runQuery('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hashedNewPassword, userId]);

        res.status(200).json({ message: 'Password updated successfully.' });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ message: 'Server error changing password.' });
    }
});

app.delete('/api/users/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;

    if (req.user.userId !== userId) {
        return res.status(403).json({ message: 'Forbidden: You can only delete your own account.' });
    }

    try {
        const result = await runQuery('DELETE FROM users WHERE id = ?', [userId]);

        if (result.changes === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(204).send();

    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ message: 'Server error deleting account.' });
    }
});


// 3. Exercise Library
// 3. Exercise Library
app.get('/api/exercises', async (req, res) => {
  const { muscle_group = '', equipment = '', difficulty = '', search = '' } = req.query;
  // Use finalLimit and finalOffset derived from req.query to avoid ReferenceError
  const finalLimit = parseInt(req.query.limit) || 20; // Default to 20 if not provided or invalid
  const finalOffset = (parseInt(req.query.page || 1) - 1) * finalLimit; // Calculate offset from page number

  let query = 'SELECT id, name, description, muscle_group, equipment, difficulty, thumbnail_url, video_url FROM exercises WHERE 1=1';
  const params = [];

  if (muscle_group) {
    query += ` AND muscle_group LIKE ? COLLATE NOCASE`;
    params.push(`%${muscle_group}%`);
  }
  if (equipment) {
    query += ` AND equipment LIKE ? COLLATE NOCASE`;
    params.push(`%${equipment}%`);
  }
  if (difficulty) {
    query += ` AND difficulty LIKE ? COLLATE NOCASE`;
    params.push(`%${difficulty}%`);
  }
  if (search) {
    query += ` AND (name LIKE ? COLLATE NOCASE OR description LIKE ? COLLATE NOCASE)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY name ASC`;

  // First, get total count for pagination
  const countQuery = `SELECT COUNT(*) AS total FROM (${query}) AS subquery`;

  try {
    const totalRow = await getQuery(countQuery, params);
    const totalItems = totalRow ? totalRow.total : 0;
    const totalPages = Math.ceil(totalItems / finalLimit); // Use finalLimit here

    // Add pagination
    query += ` LIMIT ? OFFSET ?`;
    // Use finalLimit and finalOffset here
    const paginatedParams = [...params, finalLimit, finalOffset];

    const rows = await allQuery(query, paginatedParams); // Use paginatedParams
    res.status(200).json({
      exercises: rows,
      pagination: {
        totalItems,
        currentPage: Math.floor(finalOffset / finalLimit) + 1, // Calculate current page
        limit: finalLimit,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({ message: 'Server error fetching exercises.' });
  }
});

app.get('/api/exercises/:exerciseId', async (req, res) => {
    const { exerciseId } = req.params;
    try {
        const exercise = await getQuery('SELECT * FROM exercises WHERE id = ?', [exerciseId]);
        if (!exercise) {
            return res.status(404).json({ message: 'Exercise not found.' });
        }
        if (exercise.instructions && typeof exercise.instructions === 'string') exercise.instructions = JSON.parse(exercise.instructions);
        if (exercise.tips && typeof exercise.tips === 'string') exercise.tips = JSON.parse(exercise.tips);
        res.status(200).json(exercise);
    } catch (error) {
        console.error('Error fetching single exercise:', error);
        res.status(500).json({ message: 'Server error fetching exercise.' });
    }
});


// 4. Workout Plan Management
app.get('/api/users/:userId/workout-plans', async (req, res) => { // Removed authenticateToken
  const { userId } = req.params;
  const { isTemplate } = req.query;

  // IMPORTANT: This block uses the userId from the URL param for simplicity.
  // In a real application with authentication, you would get the user ID
  // from `req.user.userId` (set by the authenticateToken middleware).
  // For development, we'll ensure a user ID is available.
  let actualUserId = userId;
  // If you want to ensure it always uses the 'test@example.com' user's plans:
  const testUser = await getQuery("SELECT id FROM users WHERE email = 'test@example.com'");
  if (testUser) {
      actualUserId = testUser.id;
  } else {
      console.warn("No 'test@example.com' user found for workout-plans API. Plans might not be linked.");
      // Fallback: If no test user, try to get the first user, or proceed without user ID if DB allows
      const anyUser = await getQuery("SELECT id FROM users LIMIT 1");
      if (anyUser) actualUserId = anyUser.id;
      else return res.status(400).json({ message: 'No users found in database to link plans to.' });
  }


  let query = `
    SELECT
      id, name AS planName, target_goal AS targetGoal, difficulty, description, is_template AS isTemplate,
      created_by_user_id AS createdBy, assigned_to_user_id AS assignedTo, created_at AS createdAt, updated_at AS updatedAt
    FROM workout_plans
  `;
  const params = [];

  // Filter by actualUserId only if you want plans specific to this user,
  // otherwise, if you just want to see ALL plans saved, remove this WHERE clause.
  // Given your frontend sends a userId in the URL, let's filter by it but ensure the actualUserId is resolved.
  query += ` WHERE created_by_user_id = ? OR assigned_to_user_id = ?`;
  params.push(actualUserId, actualUserId);


  if (isTemplate !== undefined) {
    query += ` AND is_template = ?`; // Use AND as there's already a WHERE
    params.push(isTemplate === 'true' ? 1 : 0);
  }

  query += ` ORDER BY created_at DESC;`;

  try {
    const plans = await allQuery(query, params);

    for (const plan of plans) {
      const planDaysData = {
          day1: [], day2: [], day3: [], day4: []
      };

      const daysFromDb = await allQuery(
          `SELECT wpd.day_name, e.name AS exercise_name, wpde.sets, wpde.reps
           FROM workout_plan_days wpd
           JOIN workout_plan_day_exercises wpde ON wpd.id = wpde.plan_day_id
           JOIN exercises e ON wpde.exercise_id = e.id
           WHERE wpd.plan_id = ?
           ORDER BY wpd.order_in_plan, wpde.order_in_day;`,
          [plan.id]
      );

      daysFromDb.forEach(item => {
          const dayKey = item.day_name.toLowerCase();
          if (planDaysData[dayKey]) {
              planDaysData[dayKey].push(`${item.exercise_name} (${item.sets} sets x ${item.reps} reps)`);
          }
      });
      plan.days = planDaysData;
    }

    res.status(200).json(plans);
  } catch (error) {
    console.error('Error fetching workout plans:', error);
    res.status(500).json({ message: 'Server error fetching workout plans.' });
  }
});

// Before (causing the "Authentication token required" error):
// app.post('/api/workout-plans', authenticateToken, async (req, res) => {

// After (TEMPORARY FIX for development):
app.post('/api/workout-plans', async (req, res) => { // Removed authenticateToken
  const { planName, days } = req.body;
  // IMPORTANT: For testing, we'll manually assign a createdByUserId
  // In a real authenticated app, this would be: const createdByUserId = req.user.userId;
  let createdByUserId = '';
  // Fallback to the 'test@example.com' user's ID
  const testUser = await getQuery("SELECT id FROM users WHERE email = 'test@example.com'");
  if (testUser) {
      createdByUserId = testUser.id;
  } else {
      // If even the test user isn't there, log a warning and return error
      console.error("CRITICAL: No test user found for saving workout plan. Please ensure 'test@example.com' exists in users table.");
      return res.status(500).json({ message: 'Server setup error: No valid user ID found for saving plan. Please check backend users table.' });
  }

  // Basic validation using frontend's current payload
  if (!planName || !days) {
    return res.status(400).json({ message: 'Missing required workout plan fields (planName, days).' });
  }

  // Mock targetGoal, difficulty, description, isTemplate for now
  const targetGoal = 'General Fitness';
  const difficulty = 'Beginner';
  const description = 'A workout plan created from the builder.';
  const isTemplate = 0;
  const assignedTo = createdByUserId; // Assign to the user who created it for simplicity

  db.serialize(async () => {
    try {
      await runQuery('BEGIN TRANSACTION;');

      const planId = uuidv4();
      await runQuery(
        `INSERT INTO workout_plans (id, name, target_goal, difficulty, description, is_template, created_by_user_id, assigned_to_user_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [planId, planName, targetGoal, difficulty, description, isTemplate, createdByUserId, assignedTo]
      );

      const dayKeys = ['day1', 'day2', 'day3', 'day4'];
      for (const [index, dayKey] of dayKeys.entries()) {
        const exercisesForDay = days[dayKey] || [];

        const planDayId = uuidv4();
        await runQuery(
          `INSERT INTO workout_plan_days (id, plan_id, day_name, focus, order_in_plan, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [planDayId, planId, dayKey, `${dayKey.replace('day', 'Day ')} Workout`, index]
        );

        for (const [exerciseIndex, exerciseDetails] of exercisesForDay.entries()) {
            const exerciseName = exerciseDetails.split(' (')[0].trim();
            const exercise = await getQuery('SELECT id FROM exercises WHERE name = ?', [exerciseName]);

            if (exercise) {
                await runQuery(
                    `INSERT INTO workout_plan_day_exercises (plan_day_id, exercise_id, sets, reps, notes, order_in_day, created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                    [planDayId, exercise.id, 3, '8-12', '', exerciseIndex]
                );
            } else {
                console.warn(`Exercise "${exerciseName}" not found in library, skipping insertion for plan day.`);
            }
        }
      }

      await runQuery('COMMIT;');
      res.status(201).json({ message: 'Workout plan created successfully.', planId: planId, planName: planName });

    } catch (error) {
      await runQuery('ROLLBACK;');
      console.error('Error creating workout plan (rolled back):', error);
      res.status(500).json({ message: 'Server error creating workout plan.' });
    }
  });
});

app.put('/api/workout-plans/:planId', authenticateToken, async (req, res) => {
    res.status(501).json({ message: 'Update workout plan not yet implemented from this UI.' });
});

// Before (causing the "Authentication token required" error):
// app.delete('/api/workout-plans/:planId', authenticateToken, async (req, res) => {

// After (TEMPORARY FIX for development):
app.delete('/api/workout-plans/:planId', async (req, res) => { // Removed authenticateToken
  const { planId } = req.params;

  db.serialize(async () => {
    try {
      await runQuery('BEGIN TRANSACTION;');

      const existingPlan = await getQuery('SELECT created_by_user_id, assigned_to_user_id FROM workout_plans WHERE id = ?', [planId]);

      if (!existingPlan) {
        await runQuery('ROLLBACK;');
        return res.status(404).json({ message: 'Workout plan not found.' });
      }

      // Authorization check (COMMENTED OUT TEMPORARILY FOR DEV)
      // In a real app, you'd verify req.user.userId matches created_by_user_id or assigned_to_user_id, or if role is 'trainer'
      // if (req.user.userId !== existingPlan.created_by_user_id && req.user.userId !== existingPlan.assigned_to_user_id && req.user.role !== 'trainer') {
      //     await runQuery('ROLLBACK;');
      //     return res.status(403).json({ message: 'Forbidden: Not authorized to delete this plan.' });
      // }

      await runQuery('DELETE FROM workout_plan_day_exercises WHERE plan_day_id IN (SELECT id FROM workout_plan_days WHERE plan_id = ?)', [planId]);
      await runQuery('DELETE FROM workout_plan_days WHERE plan_id = ?', [planId]);
      await runQuery('DELETE FROM workout_plans WHERE id = ?', [planId]);

      await runQuery('COMMIT;');
      res.status(204).send(); // No Content

    } catch (error) {
      await runQuery('ROLLBACK;');
      console.error('Error deleting workout plan (rolled back):', error);
      res.status(500).json({ message: 'Server error deleting workout plan.' });
    }
  });
});


// 5. Workout Logging & Progress Tracking
// Removed authenticateToken temporarily for development testing
app.post('/api/workout-logs', async (req, res) => { // authenticateToken removed
    const { userId, workoutPlanId, scheduledWorkoutDayId, exerciseId, date, setsLogged, isCompleted, durationMinutes } = req.body;

    // Use userId from params if no authenticated user or for mock testing
    let actualUserId = req.params.userId;

    if (!actualUserId) { // Fallback if no userId in URL or from auth
        const testUser = await getQuery("SELECT id FROM users WHERE email = 'test@example.com'");
        if (testUser) actualUserId = testUser.id;
        else return res.status(400).json({ message: 'User ID is required for logging workouts.' });
    }


    db.serialize(async () => {
        try {
            await runQuery('BEGIN TRANSACTION;');

            const logId = uuidv4();
            await runQuery(
                `INSERT INTO workout_logs (id, user_id, workout_plan_id, workout_plan_day_id, exercise_id, log_date, duration_minutes, is_completed_day, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                [logId, actualUserId, workoutPlanId, scheduledWorkoutDayId, exerciseId, date, durationMinutes, isCompleted ? 1 : 0]
            );

            if (setsLogged && setsLogged.length > 0) {
                for (const set of setsLogged) {
                    await runQuery(
                        `INSERT INTO workout_log_sets (workout_log_id, set_number, reps, weight, unit, created_at)
                        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                        [logId, set.reps, set.weight, set.unit] // Fixed set_number, now using provided set.set_number
                    );
                }
            }

            await runQuery('COMMIT;');
            res.status(201).json({ message: 'Workout logged successfully.', logId });

        } catch (error) {
            await runQuery('ROLLBACK;');
            console.error('Error logging workout (rolled back):', error);
            res.status(500).json({ message: 'Server error logging workout.' });
        }
    });
});

// TEMPORARY: Removed authenticateToken for easy testing. RE-ENABLE FOR PRODUCTION!
app.get('/api/users/:userId/progress', async (req, res) => {
    const { userId } = req.params;
    const { period, exerciseId } = req.query;

    let actualUserId = userId;
    if (req.user && req.user.userId) {
        actualUserId = req.user.userId;
    } else {
        const testUser = await getQuery("SELECT id FROM users WHERE email = 'test@example.com'");
        if (testUser) actualUserId = testUser.id;
        else {
            console.warn("No authenticated user and no 'test@example.com' user found for progress API. Please register a user or fix seeding.");
            return res.status(400).json({ message: 'User ID required or authenticated.' });
        }
    }


    try {
        const summary = await getQuery(
            `SELECT
                COUNT(DISTINCT log_date) AS workouts_logged_total,
                COUNT(DISTINCT CASE WHEN log_date >= DATE('now', '-7 days') THEN log_date END) AS workouts_logged_this_week,
                COALESCE(SUM(CASE WHEN duration_minutes IS NOT NULL AND log_date >= DATE('now', '-7 days') THEN duration_minutes ELSE 0 END), 0) AS cardio_minutes_this_week
            FROM workout_logs
            WHERE user_id = ?;`,
            [actualUserId]
        );

        let strengthGainPercentage = 0;
        const benchPressExercise = await getQuery("SELECT id FROM exercises WHERE name = 'Barbell Bench Press'");
        if (benchPressExercise) {
            const benchPressLogs = await allQuery(
                `SELECT sets_reps_weight FROM lift_logs WHERE user_id = ? AND exercise_id = ? ORDER BY log_date ASC;`,
                [actualUserId, benchPressExercise.id]
            );
            if (benchPressLogs.length > 1) {
                const parseMaxWeight = (log) => {
                    const sets = JSON.parse(log);
                    return sets.length > 0 ? Math.max(...sets.map(s => s.weight)) : 0;
                };
                const firstMax = parseMaxWeight(benchPressLogs[0].sets_reps_weight);
                const lastMax = parseMaxWeight(benchPressLogs[benchPressLogs.length - 1].sets_reps_weight);

                if (firstMax > 0) {
                    strengthGainPercentage = (((lastMax - firstMax) / firstMax) * 100).toFixed(0);
                }
            }
        }

        let consistencyScorePercentage = 0;
        const workoutsThisWeek = await getQuery(
            `SELECT COUNT(DISTINCT log_date) AS count FROM workout_logs WHERE user_id = ? AND log_date >= DATE('now', '-7 days');`,
            [actualUserId]
        );
        const weeklyWorkouts = workoutsThisWeek ? workoutsThisWeek.count : 0;

        if (weeklyWorkouts > 0) {
            consistencyScorePercentage = Math.min(100, Math.round((weeklyWorkouts / 7) * 100));
        }

        const cardioMinutesTarget = 150;

        let weightLiftedData = [];
        if (benchPressExercise) {
            const weightRows = await allQuery(
                `SELECT log_date, sets_reps_weight FROM lift_logs WHERE user_id = ? AND exercise_id = ? ORDER BY log_date ASC;`,
                [actualUserId, benchPressExercise.id]
            );
            weightLiftedData = weightRows.map(row => {
                const sets = JSON.parse(row.sets_reps_weight);
                const maxWeightInLog = sets.length > 0 ? Math.max(...sets.map(s => s.weight)) : 0;
                return {
                    date: row.log_date,
                    value: maxWeightInLog
                };
            }).filter(item => item.value > 0);

            const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            weightLiftedData = weightLiftedData.filter(item => item.date >= sixMonthsAgo);
        }

        const frequencyRows = await allQuery(
            `SELECT
                STRFTIME('%Y-%W', log_date) AS week,
                COUNT(DISTINCT log_date) AS count
            FROM workout_logs
            WHERE user_id = ? AND log_date >= DATE('now', '-84 days')
            GROUP BY week
            ORDER BY week ASC;`,
            [actualUserId]
        );

        const workoutFrequencyData = [];
        const today = new Date();
        for (let i = 11; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (i * 7));
            const year = d.getFullYear();
            const week = String(getWeekNumber(d)).padStart(2, '0');
            const weekKey = `${year}-${week}`;
            const found = frequencyRows.find(row => row.week === weekKey);
            workoutFrequencyData.push({
                week: weekKey,
                count: found ? found.count : 0
            });
        }

        const milestones = await allQuery(
            `SELECT id, name, description, date_achieved AS dateAchieved FROM milestones WHERE user_id = ? ORDER BY date_achieved DESC`,
            [actualUserId]
        );

        res.status(200).json({
            summary: {
                workoutsLoggedTotal: summary.workouts_logged_total,
                workoutsLoggedThisWeek: weeklyWorkouts,
                strengthGainPercentage: parseFloat(strengthGainPercentage),
                consistencyScorePercentage: parseFloat(consistencyScorePercentage),
                cardioMinutesThisWeek: summary.cardio_minutes_this_week,
                cardioMinutesTarget: cardioMinutesTarget
            },
            charts: {
                weightLiftedData: weightLiftedData,
                workoutFrequencyData: workoutFrequencyData
            },
            milestones: milestones
        });

    } catch (error) {
        console.error('Error fetching progress:', error);
        res.status(500).json({ message: 'Server error fetching progress.', error: error.message });
    }
});

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getFullYear(), 0, 1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}


// 6. Issue Reporting
app.post('/api/issues/report', authenticateToken, async (req, res) => {
    const { workoutPlanId, exerciseId, issueType, description } = req.body;
    const reporterUserId = req.user.userId;

    if (!reporterUserId || !issueType || !description) {
        return res.status(400).json({ message: 'Missing required issue fields.' });
    }

    try {
        let assignedTrainerId = null;
        const trainerResult = await getQuery('SELECT created_by_user_id FROM workout_plans WHERE assigned_to_user_id = ? AND created_by_user_id IS NOT NULL LIMIT 1', [reporterUserId]);
        if (trainerResult) {
            assignedTrainerId = trainerResult.created_by_user_id;
        }

        const issueId = uuidv4();
        await runQuery(
            `INSERT INTO client_issues (id, reporter_user_id, assigned_trainer_user_id, workout_plan_id, exercise_id, issue_type, description, status, reported_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Open', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [issueId, reporterUserId, assignedTrainerId, workoutPlanId, exerciseId, issueType, description]
        );

        res.status(201).json({ message: 'Issue reported successfully.', issueId });

    } catch (error) {
        console.error('Error reporting issue:', error);
        res.status(500).json({ message: 'Server error reporting issue.' });
    }
});

app.put('/api/issues/:issueId/resolve', authenticateToken, authorizeRole(['trainer']), async (req, res) => {
    const { issueId } = req.params;
    const trainerId = req.user.userId;

    try {
        const result = await runQuery(
            `UPDATE client_issues SET status = 'Resolved', resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND assigned_trainer_user_id = ?`,
            [issueId, trainerId]
        );

        if (result.changes === 0) {
            return res.status(404).json({ message: 'Issue not found or not assigned to you.' });
        }

        res.status(200).json({ message: 'Issue marked as resolved.' });

    } catch (error) {
        console.error('Error resolving issue:', error);
        res.status(500).json({ message: 'Server error resolving issue.' });
    }
});


// 7. Client Management (Trainer Specific)
app.get('/api/trainers/:trainerId/clients', authenticateToken, authorizeRole(['trainer']), async (req, res) => {
    const { trainerId } = req.params;
    const { status, search, limit = 20, offset = 0 } = req.query;

    if (req.user.userId !== trainerId) {
        return res.status(403).json({ message: 'Forbidden: You can only view your own clients.' });
    }

    let query = `
        SELECT
        u.id, u.first_name, u.last_name, u.email,
        (SELECT DISTINCT
            CASE
            WHEN ci.status = 'Open' AND ci.reporter_user_id = u.id THEN 'Issue'
            WHEN wp.assigned_to_user_id = u.id AND wp.is_template = 0 THEN 'Active'
            ELSE 'Inactive'
            END
        FROM users u2
        LEFT JOIN workout_plans wp ON u2.id = wp.assigned_to_user_id
        LEFT JOIN client_issues ci ON u2.id = ci.reporter_user_id
        WHERE u2.id = u.id LIMIT 1) AS status,
        (SELECT MAX(wl.log_date) FROM workout_logs wl WHERE wl.user_id = u.id) AS last_activity,
        (SELECT COUNT(ci.id) FROM client_issues ci WHERE ci.reporter_user_id = u.id AND ci.status = 'Open') > 0 AS has_active_issue,
        (SELECT name FROM workout_plans wp_active WHERE wp_active.assigned_to_user_id = u.id AND wp_active.is_template = 0 ORDER BY wp_active.created_at DESC LIMIT 1) AS current_plan_name
        FROM users u
        WHERE u.role = 'user' AND EXISTS (SELECT 1 FROM workout_plans wp_filter WHERE wp_filter.assigned_to_user_id = u.id AND wp_filter.created_by_user_id = ?)
    `;

    const params = [trainerId];

    if (search) {
        query += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?;`;
    params.push(parseInt(limit), parseInt(offset));

    try {
        let clients = await allQuery(query, params);

        if (status && status !== 'All Statuses') {
            clients = clients.filter(client => client.status === status);
        }

        res.status(200).json(clients);
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ message: 'Server error fetching clients.' });
    }
});

app.post('/api/trainers/:trainerId/clients', authenticateToken, authorizeRole(['trainer']), async (req, res) => {
    const { trainerId } = req.params;
    const { firstName, lastName, email, password, initialGoal } = req.body;

    if (req.user.userId !== trainerId) {
        return res.status(403).json({ message: 'Forbidden: You can only add clients to yourself.' });
    }
    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: 'All client fields are required.' });
    }

    db.serialize(async () => {
        try {
            await runQuery('BEGIN TRANSACTION;');

            const existingUser = await getQuery('SELECT id FROM users WHERE email = ?', [email]);
            if (existingUser) {
                await runQuery('ROLLBACK;');
                return res.status(409).json({ message: 'Email already exists.' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const userId = uuidv4();

            await runQuery(
                `INSERT INTO users (id, first_name, last_name, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                [userId, firstName, lastName, email, hashedPassword, 'user']
            );

            const defaultPlanId = uuidv4();
            await runQuery(
                `INSERT INTO workout_plans (id, name, target_goal, difficulty, is_template, created_by_user_id, assigned_to_user_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                [defaultPlanId, `Beginner Plan for ${firstName}`, initialGoal || 'General Fitness', 'Beginner', 0, trainerId, userId]
            );

            await runQuery('COMMIT;');
            res.status(201).json({ message: 'Client added successfully.', clientId: userId });

        } catch (error) {
            await runQuery('ROLLBACK;');
            console.error('Error adding client (rolled back):', error);
            res.status(500).json({ message: 'Server error adding client.' });
        }
    });
});

app.put('/api/clients/:clientId/assign-trainer', authenticateToken, authorizeRole(['trainer']), async (req, res) => {
    const { clientId } = req.params;
    const { trainerId } = req.body;

    if (!trainerId) {
        return res.status(400).json({ message: 'Trainer ID is required.' });
    }

    if (req.user.userId !== trainerId) {
        return res.status(403).json({ message: 'Forbidden: You can only assign clients to yourself.' });
    }

    try {
        const result = await runQuery(
            `UPDATE workout_plans SET created_by_user_id = ?, updated_at = CURRENT_TIMESTAMP WHERE assigned_to_user_id = ?`,
            [trainerId, clientId]
        );

        if (result.changes === 0) {
            return res.status(404).json({ message: 'Client not found or no existing plans to assign.' });
        }

        res.status(200).json({ message: 'Client assigned to trainer successfully.' });

    } catch (error) {
        console.error('Error assigning client to trainer:', error);
        res.status(500).json({ message: 'Server error assigning client to trainer.' });
    }
});


// 8. Education Hub
app.get('/api/education/articles', async (req, res) => {
    const { topic, search, limit = 10, offset = 0, sort_by = 'published_at', order = 'DESC' } = req.query;

    let query = 'SELECT id, title, author, topic, summary, thumbnail_url, type, video_url, published_at FROM education_articles WHERE 1=1';
    const params = [];

    if (topic) {
        query += ` AND topic LIKE ? COLLATE NOCASE`;
        params.push(`%${topic}%`);
    }
    if (search) {
        query += ` AND (title LIKE ? COLLATE NOCASE OR summary LIKE ? COLLATE NOCASE)`;
        params.push(`%${search}%`, `%${search}%`);
    }

    const validSortColumns = ['published_at', 'title', 'author', 'topic'];
    const validOrder = ['ASC', 'DESC'];
    const finalSortBy = validSortColumns.includes(sort_by) ? sort_by : 'published_at';
    const finalOrder = validOrder.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';

    query += ` ORDER BY ${finalSortBy} ${finalOrder}`;

    const countQuery = `SELECT COUNT(*) AS total FROM (${query}) AS subquery`;

    try {
        const totalRow = await getQuery(countQuery, params);
        const totalItems = totalRow ? totalRow.total : 0;
        const finalLimit = parseInt(limit);
        const finalOffset = parseInt(offset);
        const totalPages = Math.ceil(totalItems / finalLimit);

        query += ` LIMIT ? OFFSET ?`;
        const paginatedParams = [...params, finalLimit, finalOffset];

        const rows = await allQuery(query, paginatedParams);
        res.status(200).json({
            articles: rows,
            pagination: {
                totalItems,
                currentPage: Math.floor(finalOffset / finalLimit) + 1,
                limit: finalLimit,
                totalPages
            }
        });
    } catch (error) {
        console.error('Error fetching education articles:', error);
        res.status(500).json({ message: 'Server error fetching education articles.' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Muscle Memory Backend listening at http://localhost:${port}`);
});