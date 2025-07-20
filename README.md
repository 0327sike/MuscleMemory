Muscle Memory: Your Personalized Fitness Tracker
Muscle Memory is a web application designed to help users track their fitness journey, build custom workout plans, log progress, and access valuable educational resources.

Features

    This application combines a clean frontend interface with a robust Node.js backend and SQLite database to provide a comprehensive fitness tracking experience.

Dashboard (dashboard.html - Conceptual)

      The central hub for a quick overview of daily activities and key metrics. (Currently a placeholder, ready for dynamic content.)

Exercise Library (index.html)

      Extensive Database: Browse a dynamic library of 100+ exercises fetched directly from the backend database.
    
      Smart Search: Quickly find exercises by name or description using a large, UI-friendly search bar.
      
      Powerful Filters: Refine your search results using large, intuitive dropdowns to filter by:
    
      Muscle Group (Chest, Back, Legs, Arms, Shoulders, Core)
    
      Equipment (Dumbbells, Barbell, Bodyweight, Cables, Machine, etc.)
    
      Difficulty (Beginner, Intermediate, Advanced)
    
      Pagination: Navigate through large exercise lists with easy-to-use page controls.

Workout Builder (workout-builder.html)

      Dynamic Muscle Group Selection: Easily select exercises from categorized dropdowns (Chest, Back, Arms, etc.), with content populated live from the Exercise Library.
    
      Flexible Plan Creation: Add exercises to specific days (Day 1 to Day 4) within your current plan.
    
      Real-time Updates: See exercises immediately added to your chosen day's list.
    
      Remove Exercises: Easily remove exercises from any day.
    
      Save & Finalize: Finalize and save your complete multi-day workout plan to the backend database.
    
      Clear Plan: Clear all exercises from the current builder.

My Schedule (my-schedule.html)

      View Saved Plans: Dynamically fetches and displays all workout plans you've saved from the Workout Builder.
    
      Plan Overview: See a summary of each saved plan, including its name, creation date, and exercises per day.
    
      Interactive Daily View: Click "View" on any saved plan to populate the main schedule area, allowing you to browse exercises for Day 1 through Day 4 of that specific plan.
    
      Delete Plans: Remove unwanted workout plans from your saved list.

Progress Track (progress-track.html)

      Summary Metrics: View key performance indicators such as:
    
      Total Workouts Logged
    
      Estimated Strength Gains (e.g., Average increase in max lifts for a key exercise like Bench Press).
    
      Consistency Score (of scheduled workouts completed).
    
      Weight Lifted: Track your maximum weight lifted for specific exercises (e.g., Bench Press) over time with a dynamic bar chart.
    
      Workout Frequency: Monitor your workout consistency per week with an insightful line chart.

  Log New Lifts:

    Input specific reps, weight, and unit for any exercise from your library.

    Record notes for each lift session.

    Progress Photos:

      "Upload" progress photos (by providing an image URL for now).

      View a dynamic gallery of your saved progress pictures.

      Delete photos from your gallery.

  Milestones & Achievements:

    Log your personal fitness accomplishments (e.g., "First Pull-up," "Ran 5k").

    View a chronological list of your proudest moments.

    Delete milestones.

Education Hub (education-hub.html)

      Curated Content: Browse "Our Picks for Weekly Fitness Articles" (a dynamic list of 15+ articles).
    
      Search & Filter: Find articles by keywords in title/summary or filter by topic (Training Basics, Nutrition, Recovery, etc.).
    
      External Links: "Read More" links will directly take you to the external source (e.g., a "newspaper page" or blog) where the full article content is hosted.
    
      Technical Stack
      This application is built using modern web technologies:

Frontend:

      HTML5, CSS3, JavaScript: Core web languages.
    
      Bootstrap 5: Responsive design framework for quick UI development.
    
      FontAwesome: Icon library for visual enhancements.
    
      Chart.js: JavaScript charting library for dynamic data visualization.
    
      Backend:
    
      Node.js (Express.js): A fast, unopinionated, minimalist web framework for building server-side APIs.
    
      SQLite3: A lightweight, file-based relational database, excellent for development and small-scale applications.
      
      JWT (jsonwebtoken): JSON Web Tokens for authentication (currently bypassed for development ease, see Setup).
      
      bcryptjs: Library for hashing passwords securely.
      
      uuid: For generating unique IDs (UUIDs) for database entries.
      
      CORS (cors middleware): Enables secure communication between your frontend and backend running on different ports.
    
      dotenv: Manages environment variables for configuration.

