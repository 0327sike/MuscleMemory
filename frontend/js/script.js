document.addEventListener('DOMContentLoaded', () => {
    console.log('Muscle Memory app frontend loaded!');

    const sidebarToggle = document.getElementById('sidebarToggle');
    const wrapper = document.getElementById('wrapper');
    const fixedSigninButton = document.getElementById('fixed-signin-button');

    // --- Global Configuration & State ---
    const API_BASE_URL = 'http://localhost:3000/api'; // Ensure this matches your backend port

    // --- Utility Functions for Auth Token Management ---
    const getToken = () => localStorage.getItem('jwtToken');
    const getUserId = () => localStorage.getItem('userId');
    const getUserRole = () => localStorage.getItem('userRole');

    // --- UI Update for Sign In / My Account Button ---
    const updateAuthUI = () => {
        const token = getToken();
        if (fixedSigninButton) {
            if (token) {
                fixedSigninButton.querySelector('button').textContent = 'My Account';
                fixedSigninButton.querySelector('button').onclick = () => window.location.href = '/settings.html';
            } else {
                fixedSigninButton.querySelector('button').textContent = 'Sign In';
                fixedSigninButton.querySelector('button').onclick = () => {
                    alert('Sign In functionality not fully implemented. Please use the DEV login button for testing.');
                    // In a full application, this would redirect to a login page or open a modal.
                };
            }
        }
        // Handle clients link visibility for trainers
        const clientsNavLink = document.querySelector('a[href="/clients.html"]');
        if (clientsNavLink) {
            if (getUserRole() === 'trainer') {
                clientsNavLink.style.display = 'flex'; // Use flex to maintain icon alignment
            } else {
                clientsNavLink.style.display = 'none';
            }
        }
    };

    // --- Sidebar Toggle for smaller screens ---
    if (sidebarToggle && wrapper) {
        sidebarToggle.addEventListener('click', (e) => {
            e.preventDefault();
            wrapper.classList.toggle('toggled');
        });
    }

    // Call updateAuthUI on page load
    updateAuthUI();

    // --- Utility Functions for Loading/Error States ---
    const showLoading = (element) => {
        if (!element) return;
        element.innerHTML = `
            <div class="text-center p-5 text-muted">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading...</p>
            </div>
        `;
    };

    const showError = (element, message) => {
        if (!element) return;
        element.innerHTML = `
            <div class="alert alert-danger text-center" role="alert">
                ${message}
            </div>
        `;
    };

    // --- Core Function to Fetch and Render Exercises ---
    async function fetchAndDisplayExercises(muscleGroup = null, equipment = null, difficulty = null, search = null, targetElement) {
        if (!targetElement) {
            console.warn("fetchAndDisplayExercises called without a valid targetElement.");
            return;
        }
        showLoading(targetElement);
        let url = `${API_BASE_URL}/exercises?limit=100`; // Fetch a reasonable limit
        if (muscleGroup) url += `&muscleGroup=${encodeURIComponent(muscleGroup)}`;
        if (equipment) url += `&equipment=${encodeURIComponent(equipment)}`;
        if (difficulty) url += `&difficulty=${encodeURIComponent(difficulty)}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const exercises = await response.json();
            renderExercises(exercises, targetElement);
        } catch (error) {
            console.error('Error fetching exercises:', error);
            showError(targetElement, `Failed to load exercises: ${error.message}`);
        }
    }

    // Function to render exercises into a given DOM element
    function renderExercises(exercises, targetElement) {
        if (!targetElement) return;
        targetElement.innerHTML = ''; // Clear previous exercises
        if (!exercises || exercises.length === 0) {
            targetElement.innerHTML = '<div class="text-center p-4 text-muted">No exercises found. Adjust filters or search.</div>';
            return;
        }

        exercises.forEach(exercise => {
            const exerciseItem = document.createElement('div');
            exerciseItem.className = 'workout-item card mb-3 shadow-sm';
            // Note: Use exercise.muscle_group, exercise.equipment, exercise.difficulty from backend
            exerciseItem.innerHTML = `
                <div class="card-body d-flex align-items-center">
                    <img src="${exercise.thumbnail_url || 'https://via.placeholder.com/60x60?text=Exercise'}" alt="${exercise.name}" class="me-3 rounded">
                    <div class="workout-details flex-grow-1">
                        <h5 class="card-title mb-0">${exercise.name}</h5>
                        <p class="card-text text-muted small">${exercise.muscle_group || 'N/A'}, ${exercise.equipment || 'N/A'}, ${exercise.difficulty || 'N/A'}</p>
                    </div>
                    <button class="add-to-plan-btn btn btn-primary btn-sm"
                            data-exercise-id="${exercise.id}"
                            data-exercise-name="${exercise.name}"
                            data-exercise-sets="3"
                            data-exercise-reps="10"
                            data-exercise-thumbnail="${exercise.thumbnail_url}">Add</button>
                </div>
            `;
            targetElement.appendChild(exerciseItem);
        });

        // Attach listeners for 'Add' buttons (common to Exercise Library and Workout Builder)
        document.querySelectorAll('.add-to-plan-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                // This function `addExerciseToCurrentPlan` is only defined for workout-builder.html.
                // Call it only if it exists in the current scope.
                if (typeof addExerciseToCurrentPlan === 'function') {
                    const exerciseId = e.target.dataset.exerciseId;
                    const exerciseName = e.target.dataset.exerciseName;
                    const exerciseSets = e.target.dataset.exerciseSets;
                    const exerciseReps = e.target.dataset.exerciseReps;
                    const exerciseThumbnail = e.target.dataset.exerciseThumbnail;
                    addExerciseToCurrentPlan(exerciseId, exerciseName, exerciseSets, exerciseReps, exerciseThumbnail);
                } else {
                    // This case would apply to the Exercise Library (index.html) if 'Add' button should do something there
                    // For now, it might just display an alert or nothing, as per project requirements
                    alert(`Exercise "${e.target.dataset.exerciseName}" added (simulated for Exercise Library).`);
                    console.log(`Exercise ID: ${e.target.dataset.exerciseId} was "added" from Exercise Library.`);
                }
            });
        });
    }

    // --- Page-Specific Initialization Blocks ---

    // 1. Exercise Library Page (`index.html`)
    const indexPageH2 = document.querySelector('h3.card-title.mb-2'); // Specific element on index.html
    if (indexPageH2 && indexPageH2.textContent.includes('Selected')) { // Check if we are on index.html
        const bodyDiagramEl = document.getElementById('bodyDiagram');
        const suggestedWorkoutsListEl = document.querySelector('#indexPage-SuggestedWorkouts .workout-list'); // More specific selector for index.html's list
        const selectedMuscleHeadingEl = document.getElementById('selectedMuscleHeading');

        if (bodyDiagramEl && suggestedWorkoutsListEl && selectedMuscleHeadingEl) {
            const bodyDiagramContainer = document.createElement('div');
            bodyDiagramContainer.className = 'human-body-diagram-placeholder text-center p-4 border rounded bg-light';
            bodyDiagramContainer.style.height = '300px';
            bodyDiagramContainer.style.display = 'flex';
            bodyDiagramContainer.style.alignItems = 'center';
            bodyDiagramContainer.style.justifyContent = 'center';
            bodyDiagramContainer.style.cursor = 'pointer';
            bodyDiagramContainer.innerHTML = `
                <img src="https://via.placeholder.com/200x280?text=Click+for+Muscles" alt="Human Body Diagram" class="img-fluid" id="interactiveBodyImage">
                <p class="text-muted small mt-2">Click me to select muscle group!</p>
            `;
            bodyDiagramEl.replaceWith(bodyDiagramContainer);

            const interactiveBodyImage = document.getElementById('interactiveBodyImage');
            const muscleGroups = ['Chest', 'Back', 'Legs', 'Arms', 'Shoulders', 'Core'];
            let currentMuscleIndex = 0; // Start with Chest

            interactiveBodyImage.addEventListener('click', () => {
                currentMuscleIndex = (currentMuscleIndex + 1) % muscleGroups.length;
                const nextMuscle = muscleGroups[currentMuscleIndex];

                selectedMuscleHeadingEl.textContent = `Selected ${nextMuscle}`;
                fetchAndDisplayExercises(nextMuscle, null, null, null, suggestedWorkoutsListEl);
            });

            // Initial load for the interactive body diagram section
            selectedMuscleHeadingEl.textContent = `Selected ${muscleGroups[currentMuscleIndex]}`;
            fetchAndDisplayExercises(muscleGroups[currentMuscleIndex], null, null, null, suggestedWorkoutsListEl);
        }
    }


    // 2. Workout Builder Page (`workout-builder.html`)
    const workoutBuilderPageH2 = document.querySelector('h2.mb-4');
    if (workoutBuilderPageH2 && workoutBuilderPageH2.textContent.includes('Build Your New Workout Plan')) {
        const exerciseSearchInput = document.querySelector('.card-body .input-group input[type="text"]');
        const exerciseSearchBtn = document.querySelector('.card-body .input-group button[type="button"]');
        const muscleGroupFilter = document.querySelector('.card.shadow-sm:nth-of-type(2) .col-md-4:nth-child(1) select');
        const equipmentFilter = document.querySelector('.card.shadow-sm:nth-of-type(2) .col-md-4:nth-child(2) select');
        const difficultyFilter = document.querySelector('.card.shadow-sm:nth-of-type(2) .col-md-4:nth-child(3) select');
        const currentPlanNameSpan = document.getElementById('currentPlanName');
        const workoutPlanDaysContainer = document.querySelector('.card.shadow-sm:nth-of-type(3) .row.g-3');

        // Initial load of all exercises for the builder search section
        const workoutBuilderExercisesList = document.querySelector('.card.shadow-sm:nth-of-type(2) .workout-list');
        if (workoutBuilderExercisesList) {
            fetchAndDisplayExercises(null, null, null, null, workoutBuilderExercisesList);
        }

        const applyFilters = () => {
            const searchVal = exerciseSearchInput ? exerciseSearchInput.value : null;
            const muscleVal = muscleGroupFilter && muscleGroupFilter.value !== 'All Muscle Groups' ? muscleGroupFilter.value : null;
            const equipmentVal = equipmentFilter && equipmentFilter.value !== 'All Equipment' ? equipmentFilter.value : null;
            const difficultyVal = difficultyFilter && difficultyFilter.value !== 'All Difficulties' ? difficultyFilter.value : null;
            if (workoutBuilderExercisesList) {
                fetchAndDisplayExercises(muscleVal, equipmentVal, difficultyVal, searchVal, workoutBuilderExercisesList);
            }
        };

        if (exerciseSearchBtn) exerciseSearchBtn.addEventListener('click', applyFilters);
        if (exerciseSearchInput) exerciseSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') applyFilters();
        });
        if (muscleGroupFilter) muscleGroupFilter.addEventListener('change', applyFilters);
        if (equipmentFilter) equipmentFilter.addEventListener('change', applyFilters);
        if (difficultyFilter) difficultyFilter.addEventListener('change', applyFilters);


        let currentWorkoutPlan = {
            name: document.getElementById('planName')?.value || 'New Workout Plan',
            targetGoal: document.getElementById('targetGoal')?.value || 'General Fitness',
            difficulty: document.getElementById('difficulty')?.value || 'Beginner',
            description: document.getElementById('planDescription')?.value || '',
            isTemplate: false,
            assignedTo: null,
            days: [
                { dayName: 'Monday', focus: 'Full Body Strength', exercises: [] },
                { dayName: 'Tuesday', focus: 'Upper Body Focus', exercises: [] },
                { dayName: 'Wednesday', focus: 'Legs & Core', exercises: [] },
                { dayName: 'Thursday', focus: 'Rest / Active Recovery', exercises: [] },
                { dayName: 'Friday', focus: 'Full Body Endurance', exercises: [] },
                { dayName: 'Saturday', focus: 'Cardio & Mobility', exercises: [] },
                { dayName: 'Sunday', focus: 'Rest', exercises: [] }
            ]
        };

        // Function specific to Workout Builder to render the current plan in the UI
        const renderCurrentPlan = () => {
            if (currentPlanNameSpan) currentPlanNameSpan.textContent = document.getElementById('planName')?.value || 'New Workout Plan';
            if (workoutPlanDaysContainer) workoutPlanDaysContainer.innerHTML = ''; // Clear existing days

            currentWorkoutPlan.days.forEach((day, dayIndex) => {
                const dayCol = document.createElement('div');
                dayCol.className = 'col-lg-6';
                dayCol.innerHTML = `
                    <div class="p-4 border rounded bg-light min-height-200">
                        <h5 class="mb-3">${day.dayName}: ${day.focus}</h5>
                        <ul class="list-group list-group-flush draggable-list" data-day-index="${dayIndex}">
                            ${day.exercises.map(ex => `
                                <li class="list-group-item d-flex justify-content-between align-items-center bg-white shadow-sm-light mb-2 p-3 rounded" data-exercise-id="${ex.exerciseId}">
                                    <span>${ex.name} (${ex.sets || 'X'} sets x ${ex.reps || 'Y'} reps)</span>
                                    <i class="fas fa-times-circle text-danger ms-auto cursor-pointer remove-exercise-btn"></i>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;
                if (workoutPlanDaysContainer) workoutPlanDaysContainer.appendChild(dayCol);
            });

            document.querySelectorAll('.remove-exercise-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const listItem = e.target.closest('li');
                    const exerciseIdToRemove = listItem.dataset.exerciseId;
                    const dayList = e.target.closest('.draggable-list');
                    const dayIndex = parseInt(dayList.dataset.dayIndex, 10);

                    currentWorkoutPlan.days[dayIndex].exercises = currentWorkoutPlan.days[dayIndex].exercises.filter(
                        ex => ex.exerciseId !== exerciseIdToRemove
                    );
                    renderCurrentPlan(); // Re-render the plan
                });
            });
        };

        // Function specific to Workout Builder to add an exercise to the current plan
        const addExerciseToCurrentPlan = (exerciseId, exerciseName, exerciseSets, exerciseReps, exerciseThumbnail) => {
            const targetDay = currentWorkoutPlan.days[0]; // Default to Day 1
            const newExercise = {
                exerciseId: exerciseId,
                name: exerciseName,
                sets: exerciseSets || '3',
                reps: exerciseReps || '10',
                notes: '',
                thumbnailUrl: exerciseThumbnail
            };
            targetDay.exercises.push(newExercise);
            renderCurrentPlan();
        };


        // Event listeners for plan details input fields
        if (document.getElementById('planName')) document.getElementById('planName').addEventListener('input', (e) => {
            currentWorkoutPlan.name = e.target.value;
            if (currentPlanNameSpan) currentPlanNameSpan.textContent = e.target.value || 'New Workout Plan';
        });
        if (document.getElementById('targetGoal')) document.getElementById('targetGoal').addEventListener('change', (e) => currentWorkoutPlan.targetGoal = e.target.value);
        if (document.getElementById('difficulty')) document.getElementById('difficulty').addEventListener('change', (e) => currentWorkoutPlan.difficulty = e.target.value);
        if (document.getElementById('planDescription')) document.getElementById('planDescription').addEventListener('input', (e) => currentWorkoutPlan.description = e.target.value);


        // Save/Finalize Plan Buttons
        document.querySelector('.btn-primary i.fa-play')?.closest('button').addEventListener('click', async () => {
            alert('Starting to build. Fill details and add exercises!');
        });

        document.querySelector('.btn-outline-secondary i.fa-save')?.closest('button').addEventListener('click', async () => {
            const token = getToken();
            if (!token) { alert('Please sign in to save plans.'); return; }
            if (getUserRole() !== 'trainer') { alert('Only trainers can save templates.'); return; }

            const planToSave = { ...currentWorkoutPlan, isTemplate: true, assignedTo: null };

            try {
                const response = await fetch(`${API_BASE_URL}/workout-plans`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(planToSave)
                });
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Failed to save plan as template.');
                }
                const result = await response.json();
                alert(`Template "${result.plan.name}" saved successfully!`);
            } catch (error) {
                console.error('Error saving template:', error);
                alert(`Error saving template: ${error.message}`);
            }
        });

        document.querySelector('.btn-success i.fa-check-circle')?.closest('button').addEventListener('click', async () => {
            const token = getToken();
            const userId = getUserId();
            if (!token || !userId) { alert('Please sign in to finalize a plan.'); return; }

            const planToFinalize = { ...currentWorkoutPlan, isTemplate: false, assignedTo: userId };

            try {
                const response = await fetch(`${API_BASE_URL}/workout-plans`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(planToFinalize)
                });
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Failed to finalize plan.');
                }
                const result = await response.json();
                alert(`Workout Plan "${result.plan.name}" finalized and added to your schedule!`);
                window.location.href = '/my-schedule.html';
            } catch (error) {
                console.error('Error finalizing plan:', error);
                alert(`Error finalizing plan: ${error.message}`);
            }
        });

        document.querySelector('.btn-outline-danger i.fa-trash-alt')?.closest('button').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the current plan? This cannot be undone.')) {
                currentWorkoutPlan.days.forEach(day => day.exercises = []);
                document.getElementById('planName').value = '';
                document.getElementById('targetGoal').value = 'Choose...';
                document.getElementById('difficulty').value = 'Beginner';
                document.getElementById('planDescription').value = '';
                renderCurrentPlan();
                currentPlanNameSpan.textContent = 'New Workout Plan';
                alert('Plan cleared.');
            }
        });

        // Initial render of the empty/default plan for Workout Builder
        renderCurrentPlan();
    }


    // 3. My Schedule Page (`my-schedule.html`)
    const mySchedulePageH2 = document.querySelector('h2.mb-4');
    if (mySchedulePageH2 && mySchedulePageH2.textContent.includes('Your Weekly Workout Schedule')) {
        const scheduleDaysContainer = document.querySelector('.d-flex.justify-content-center.flex-wrap.gap-2');
        const currentWorkoutDisplay = document.querySelector('.card-body h3.card-title.mb-0');
        const currentWorkoutDescription = document.querySelector('.card-body p.card-text.text-muted');
        const dailyExercisesList = document.querySelector('.card-body ul.list-group-flush');
        const prevWeekBtn = document.querySelector('.btn-outline-secondary.me-2');
        const nextWeekBtn = document.querySelector('.btn-outline-secondary:not(.me-2)');
        const startWorkoutBtn = document.querySelector('.card-body .btn-primary i.fa-play')?.closest('button');
        const markIncompleteBtn = document.querySelector('.card-body .btn-outline-danger');
        const editThisDayBtn = document.querySelector('.card-body .btn-outline-info');


        let currentUserId = getUserId();
        // Get client ID from URL if a trainer is viewing a client's schedule
        const urlParams = new URLSearchParams(window.location.search);
        const clientIdFromUrl = urlParams.get('clientId');
        if (getUserRole() === 'trainer' && clientIdFromUrl) {
            currentUserId = clientIdFromUrl; // Override userId to view client's schedule
        }


        let currentWeekStart = new Date(); // Start of the current week (Sunday)
        currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay()); // Adjust to Sunday (0-6)
        currentWeekStart.setHours(0,0,0,0); // Normalize to start of day

        const fetchAndRenderSchedule = async (userId, weekStart) => {
            if (!userId) {
                showError(mySchedulePageH2.closest('.container-fluid'), 'Please log in to view your schedule.');
                return;
            }

            const weekStartISO = weekStart.toISOString().split('T')[0];
            // API currently fetches all plans. For a live app, you'd filter by start/end dates on backend.
            const url = `${API_BASE_URL}/users/${userId}/workout-plans`;

            showLoading(mySchedulePageH2.closest('.container-fluid')?.querySelector('.card:nth-of-type(2) .card-body'));

            try {
                const token = getToken();
                const response = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const plans = await response.json();

                // For simplicity, let's select the most recent non-template plan, or the first one if multiple.
                const activePlan = plans.find(p => !p.isTemplate) || plans[0];

                renderWeeklyButtons(weekStart);
                // Render the workout for the selected day (today by default)
                renderDailyWorkout(activePlan, new Date(), currentUserId);

            } catch (error) {
                console.error('Error fetching schedule:', error);
                showError(mySchedulePageH2.closest('.container-fluid')?.querySelector('.card:nth-of-type(2) .card-body'), `Failed to load schedule: ${error.message}`);
            }
        };

        const renderWeeklyButtons = (weekStart) => {
            if (!scheduleDaysContainer) return;
            scheduleDaysContainer.innerHTML = '';
            const daysOfWeekNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const today = new Date();
            today.setHours(0,0,0,0);

            for (let i = 0; i < 7; i++) {
                const dayDate = new Date(weekStart);
                dayDate.setDate(weekStart.getDate() + i);
                const button = document.createElement('button');
                button.className = `btn btn-light ${dayDate.getTime() === today.getTime() ? 'active' : ''}`;
                button.textContent = daysOfWeekNames[i];
                button.dataset.date = dayDate.toISOString().split('T')[0];
                button.addEventListener('click', (e) => {
                    document.querySelectorAll('.d-flex.justify-content-center.flex-wrap.gap-2 .btn').forEach(btn => btn.classList.remove('active'));
                    e.target.classList.add('active');
                    // Re-render for the selected day (requires refetching or having all plan data locally)
                    // For now, this just highlights the button. A full implementation would re-render the daily workout card.
                    alert(`Selected ${e.target.textContent}. Daily workout display update not fully implemented for date change.`);
                });
                scheduleDaysContainer.appendChild(button);
            }
        };

        const renderDailyWorkout = (plan, date, targetUserId) => {
            if (!dailyExercisesList || !currentWorkoutDisplay || !currentWorkoutDescription) return;

            if (!plan || !plan.days || plan.days.length === 0) {
                dailyExercisesList.innerHTML = '<div class="text-center p-4 text-muted">No workout scheduled for this day.</div>';
                currentWorkoutDisplay.textContent = `${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`;
                currentWorkoutDescription.textContent = 'No plan found for this day.';
                return;
            }

            // SQLite's STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now') makes dates strings.
            // Be careful if comparing JS Date objects directly to database date strings
            // For example, day.orderInPlan is the array index (0-6 for Sun-Sat)
            const targetDay = plan.days.find(d => d.orderInPlan === date.getDay());

            if (!targetDay || !targetDay.exercises || targetDay.exercises.length === 0) {
                dailyExercisesList.innerHTML = '<div class="text-center p-4 text-muted">No exercises scheduled for this day.</div>';
                currentWorkoutDisplay.textContent = `${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`;
                currentWorkoutDescription.textContent = 'Rest or active recovery.';
                return;
            }

            currentWorkoutDisplay.textContent = `${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} - ${targetDay.focus || 'Workout'}`;
            currentWorkoutDescription.textContent = plan.description || 'Your daily workout session.';
            dailyExercisesList.innerHTML = ''; // Clear existing

            targetDay.exercises.forEach(exercise => {
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item d-flex justify-content-between align-items-center p-3';
                // For simplicity, always show Log Set button for now, actual completion from logs is more complex
                // You'd need to fetch logs for this specific exercise and date to determine 'Completed'
                listItem.innerHTML = `
                    <div>
                        <h5 class="mb-0">${exercise.name}</h5>
                        <small class="text-muted">${exercise.sets} sets of ${exercise.reps} reps</small>
                    </div>
                    <button class="btn btn-outline-primary btn-sm log-set-btn"
                               data-exercise-id="${exercise.exerciseId}"
                               data-plan-id="${plan.id}"
                               data-plan-day-id="${targetDay.id}"
                               data-target-user-id="${targetUserId}">Log Set</button>
                `;
                dailyExercisesList.appendChild(listItem);
            });

            document.querySelectorAll('.log-set-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const exerciseId = e.target.dataset.exerciseId;
                    const planId = e.target.dataset.planId;
                    const planDayId = e.target.dataset.planDayId;
                    const userIdToLogFor = e.target.dataset.targetUserId; // Use the target user ID for logging
                    const token = getToken();

                    if (!userIdToLogFor || !token) { alert('Authentication missing. Please log in.'); return; }

                    const reps = prompt('Enter reps completed for this set:');
                    const weight = prompt('Enter weight (e.g., 50) and unit (e.g., kg, lbs):');
                    const [weightVal, unit] = weight ? weight.split(' ') : [null, null];

                    if (!reps || !weightVal) {
                        alert('Log cancelled or incomplete. Both reps and weight are required.');
                        return;
                    }

                    try {
                        const response = await fetch(`${API_BASE_URL}/workout-logs`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                userId: userIdToLogFor, // Log for this user
                                workoutPlanId: planId,
                                scheduledWorkoutDayId: planDayId,
                                exerciseId: exerciseId,
                                date: new Date().toISOString().split('T')[0], // Current date
                                setsLogged: [{ setNumber: 1, reps: parseInt(reps), weight: parseFloat(weightVal), unit: unit || 'lbs' }],
                                isCompleted: false // Mark individual sets, not full exercise yet (can be extended)
                            })
                        });

                        if (!response.ok) {
                            const error = await response.json();
                            throw new Error(error.message || 'Failed to log set.');
                        }
                        alert('Set logged successfully! 💪');
                        // Optional: Visually update the button to "Logged" or "Completed"
                        e.target.closest('li').querySelector('button').replaceWith(
                            (() => {
                                const span = document.createElement('span');
                                span.className = 'badge bg-success rounded-pill p-2';
                                span.innerHTML = '<i class="fas fa-check"></i> Logged';
                                return span;
                            })()
                        );
                    } catch (error) {
                        console.error('Error logging set:', error);
                        alert(`Error logging set: ${error.message}`);
                    }
                });
            });

            if (startWorkoutBtn) {
                startWorkoutBtn.addEventListener('click', () => {
                    alert('Workout Started! (Functionality to track time/sets in-session not fully implemented).');
                });
            }
            if (markIncompleteBtn) {
                markIncompleteBtn.addEventListener('click', () => {
                    alert('Workout for today marked as incomplete (simulated).');
                    // API call to mark the day's scheduled workout as incomplete
                });
            }
            if (editThisDayBtn) {
                editThisDayBtn.addEventListener('click', () => {
                    alert('Editing this day (simulated). This would typically open the Workout Builder with this plan/day pre-loaded.');
                    // window.location.href = `/workout-builder.html?planId=${plan.id}&dayId=${targetDay.id}`;
                });
            }
        };

        // Initial fetch of schedule for the current user/client
        fetchAndRenderSchedule(currentUserId, currentWeekStart);

        if (prevWeekBtn) {
            prevWeekBtn.addEventListener('click', () => {
                currentWeekStart.setDate(currentWeekStart.getDate() - 7);
                fetchAndRenderSchedule(currentUserId, currentWeekStart);
            });
        }
        if (nextWeekBtn) {
            nextWeekBtn.addEventListener('click', () => {
                currentWeekStart.setDate(currentWeekStart.getDate() + 7);
                fetchAndRenderSchedule(currentUserId, currentWeekStart);
            });
        }
    }


    // 4. Progress Track Page (`progress-track.html`)
    const progressTrackPageH2 = document.querySelector('h2.mb-4');
    if (progressTrackPageH2 && progressTrackPageH2.textContent.includes('Your Fitness Progress')) {
        const currentUserId = getUserId();
        const token = getToken();

        const workoutsLoggedEl = document.querySelector('.col-lg-4 .card-body .display-4.fw-bold.text-primary');
        const strengthGainsEl = document.querySelector('.col-lg-4 .card-body .display-4.fw-bold.text-success');
        const consistencyScoreEl = document.querySelector('.col-lg-4 .card-body .display-4.fw-bold.text-info');
        const weightChartContainer = document.querySelector('.col-lg-6:nth-of-type(1) .card-body');
        const frequencyChartContainer = document.querySelector('.col-lg-6:nth-of-type(2) .card-body');
        const milestonesContainer = document.querySelector('.card:nth-of-type(3) .card-body .row.g-3');

        const fetchAndRenderProgress = async (userId, period = 'all') => {
            if (!userId) {
                showError(progressTrackPageH2.closest('.container-fluid'), 'Please log in to view your progress.');
                return;
            }

            showLoading(workoutsLoggedEl.closest('.card-body')); // For summary cards
            showLoading(weightChartContainer);
            showLoading(frequencyChartContainer);
            showLoading(milestonesContainer);

            try {
                const response = await fetch(`${API_BASE_URL}/users/${userId}/progress?period=${period}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const progressData = await response.json();

                if (workoutsLoggedEl) workoutsLoggedEl.textContent = progressData.summary.workoutsLoggedTotal;
                if (strengthGainsEl) strengthGainsEl.textContent = `+${progressData.summary.strengthGainPercentage}%`;
                if (consistencyScoreEl) consistencyScoreEl.textContent = `${progressData.summary.consistencyScorePercentage}%`;

                renderCharts(progressData.charts);
                renderMilestones(progressData.milestones);

            } catch (error) {
                console.error('Error fetching progress:', error);
                showError(workoutsLoggedEl.closest('.card-body'), `Failed to load progress data: ${error.message}`);
                showError(weightChartContainer, '');
                showError(frequencyChartContainer, '');
                showError(milestonesContainer, '');
            }
        };

        const renderCharts = (chartData) => {
            if (!weightChartContainer || !frequencyChartContainer) return;

            weightChartContainer.innerHTML = `
                <h4 class="mb-3">Weight Lifted (Last 6 Months)</h4>
                <canvas id="weightChart"></canvas>
                <small class="text-muted d-block mt-2">Barbell Squats - Max Weight (kg)</small>
            `;
            frequencyChartContainer.innerHTML = `
                <h4 class="mb-3">Workout Frequency (Last 12 Weeks)</h4>
                <canvas id="frequencyChart"></canvas>
                <small class="text-muted d-block mt-2">Workouts per week</small>
            `;

            const weightCtx = document.getElementById('weightChart')?.getContext('2d');
            if (weightCtx) {
                new Chart(weightCtx, {
                    type: 'bar',
                    data: {
                        labels: chartData.weightLiftedData.map(d => d.date),
                        datasets: [{
                            label: 'Max Weight (kg)',
                            data: chartData.weightLiftedData.map(d => d.value),
                            backgroundColor: 'rgba(0, 123, 255, 0.5)',
                            borderColor: 'rgba(0, 123, 255, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: { y: { beginAtZero: true } }
                    }
                });
            }

            const freqCtx = document.getElementById('frequencyChart')?.getContext('2d');
            if (freqCtx) {
                new Chart(freqCtx, {
                    type: 'line',
                    data: {
                        labels: chartData.workoutFrequencyData.map(d => d.week),
                        datasets: [{
                            label: 'Workouts per Week',
                            data: chartData.workoutFrequencyData.map(d => d.count),
                            borderColor: 'rgb(75, 192, 192)',
                            tension: 0.1
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: { y: { beginAtZero: true } }
                    }
                });
            }
        };

        const renderMilestones = (milestones) => {
            if (!milestonesContainer) return;
            milestonesContainer.innerHTML = '';
            if (!milestones || milestones.length === 0) {
                milestonesContainer.innerHTML = '<div class="col-12 text-center p-4 text-muted">No milestones achieved yet. Keep going!</div>';
                return;
            }
            milestones.forEach(milestone => {
                const milestoneEl = document.createElement('div');
                milestoneEl.className = 'col-md-6 col-lg-4';
                milestoneEl.innerHTML = `
                    <div class="p-3 border rounded bg-light d-flex align-items-center shadow-sm-light">
                        <i class="fas fa-trophy fa-2x text-warning me-3"></i>
                        <div>
                            <h5 class="mb-0">${milestone.name}</h5>
                            <small class="text-muted">Achieved on ${milestone.dateAchieved}</small>
                        </div>
                    </div>
                `;
                milestonesContainer.appendChild(milestoneEl);
            });
        };

        fetchAndRenderProgress(currentUserId);
    }

    // 5. Clients Page (`clients.html`)
    const clientsPageH2 = document.querySelector('h2.mb-4');
    if (clientsPageH2 && clientsPageH2.textContent.includes('Your Clients')) {
        const currentTrainerId = getUserId();
        const token = getToken();

        const clientSearchInput = document.querySelector('.card-body .input-group input[type="text"]');
        const clientSearchBtn = document.querySelector('.card-body .input-group button[type="button"]');
        const statusFilter = document.querySelector('.col-md-4 select:nth-of-type(1)');
        const clientTableBody = document.querySelector('.table-responsive tbody');
        const addClientBtn = document.querySelector('.d-flex.justify-content-between.align-items-center.mb-4 .btn-primary');

        const fetchAndRenderClients = async (trainerId, status = null, search = null) => {
            if (getUserRole() !== 'trainer') {
                showError(clientsPageH2.closest('.container-fluid'), 'Access Denied: Only trainers can view clients.');
                if (clientTableBody) clientTableBody.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-muted">You must be logged in as a trainer to view this page.</td></tr>';
                return;
            }
            if (!trainerId) {
                showError(clientsPageH2.closest('.container-fluid'), 'Trainer ID missing. Please log in as a trainer.');
                if (clientTableBody) clientTableBody.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-muted">Could not retrieve trainer ID.</td></tr>';
                return;
            }

            let url = `${API_BASE_URL}/trainers/${trainerId}/clients`;
            let queryParams = [];
            if (status && status !== 'All Statuses') queryParams.push(`status=${encodeURIComponent(status)}`);
            if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
            if (queryParams.length > 0) url += '?' + queryParams.join('&');

            showLoading(clientTableBody);

            try {
                const response = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Unknown error.' }));
                    throw new Error(`HTTP error! status: ${response.status} - ${errorData.message}`);
                }
                const clients = await response.json();
                renderClientsTable(clients);
            } catch (error) {
                console.error('Error fetching clients:', error);
                showError(clientTableBody, `Failed to load clients: ${error.message}`);
            }
        };

        const renderClientsTable = (clients) => {
            if (!clientTableBody) return;
            clientTableBody.innerHTML = '';
            if (!clients || clients.length === 0) {
                clientTableBody.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-muted">No clients found.</td></tr>';
                return;
            }

            clients.forEach(client => {
                const row = document.createElement('tr');
                let statusBadgeClass = '';
                switch (client.status) {
                    case 'Active': statusBadgeClass = 'bg-success'; break;
                    case 'Issue': statusBadgeClass = 'bg-warning text-dark'; break;
                    case 'New Inquiry': statusBadgeClass = 'bg-primary'; break;
                    default: statusBadgeClass = 'bg-secondary'; break;
                }
                const lastActivityDate = client.last_activity ? new Date(client.last_activity).toLocaleDateString() : 'N/A'; // Backend sends last_activity

                row.innerHTML = `
                    <td>${client.first_name} ${client.last_name}</td>
                    <td><span class="badge ${statusBadgeClass}">${client.status}</span></td>
                    <td>${client.trainer_first_name || 'N/A'}</td>
                    <td>${lastActivityDate}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1 view-client-plan-btn" data-client-id="${client.id}">View Plan</button>
                        <button class="btn btn-sm btn-outline-info edit-client-btn" data-client-id="${client.id}">Edit</button>
                        ${client.has_active_issue ? `<button class="btn btn-sm btn-outline-danger resolve-issue-btn" data-client-id="${client.id}">Resolve Issue</button>` : ''}
                    </td>
                `;
                clientTableBody.appendChild(row);
            });

            document.querySelectorAll('.view-client-plan-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const clientId = e.target.dataset.clientId;
                    window.location.href = `/my-schedule.html?clientId=${clientId}`;
                });
            });

            document.querySelectorAll('.edit-client-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const clientId = e.target.dataset.clientId;
                    alert(`Editing client ${clientId} (simulated).`);
                });
            });

            document.querySelectorAll('.resolve-issue-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const clientId = e.target.dataset.clientId;
                    if (confirm(`Resolve active issues for client ${clientId}?`)) {
                        alert(`Resolving issues for client ${clientId} (simulated).`);
                        // This would need a specific API call. For now, it's a placeholder.
                        // Example: await fetch(`${API_BASE_URL}/issues/resolve-by-client/${clientId}`, {method: 'PUT', headers: {'Authorization': `Bearer ${token}`}});
                    }
                });
            });
        };

        if (clientSearchBtn) clientSearchBtn.addEventListener('click', () => fetchAndRenderClients(currentTrainerId, statusFilter?.value, clientSearchInput?.value));
        if (clientSearchInput) clientSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') fetchAndRenderClients(currentTrainerId, statusFilter?.value, clientSearchInput?.value);
        });
        if (statusFilter) statusFilter.addEventListener('change', () => fetchAndRenderClients(currentTrainerId, statusFilter.value, clientSearchInput?.value));
        if (addClientBtn) addClientBtn.addEventListener('click', () => {
            alert('Add New Client functionality (simulated). This would open a form to register a new client.');
        });

        fetchAndRenderClients(currentTrainerId);
    }

    // 6. Education Hub Page (`education-hub.html`)
    const educationHubPageH2 = document.querySelector('h2.mb-4');
    if (educationHubPageH2 && educationHubPageH2.textContent.includes('Your Fitness Knowledge Hub')) {
        const searchInput = document.querySelector('.card-body .input-group input[type="text"]');
        const searchBtn = document.querySelector('.card-body .input-group button[type="button"]');
        const topicFilterButtons = document.querySelectorAll('.d-flex.flex-wrap.gap-2 button'); // Select all buttons in the topic filter
        const featuredArticlesContainer = document.querySelector('.card:nth-of-type(2) .row.g-4');
        const quickTipsContainer = document.querySelector('.card:nth-of-type(3) .row.g-3');

        let currentTopic = 'All Topics'; // Default

        const fetchAndRenderEducation = async (topic = null, search = null) => {
            let url = `${API_BASE_URL}/education/articles?limit=20`;
            if (topic && topic !== 'All Topics') url += `&topic=${encodeURIComponent(topic)}`;
            if (search) url += `&search=${encodeURIComponent(search)}`;

            showLoading(featuredArticlesContainer);
            showLoading(quickTipsContainer);

            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const articles = await response.json();

                // Backend field names might be different (e.g., 'type' not 'articleType')
                renderFeaturedArticles(articles.filter(a => a.type === 'article'));
                renderQuickTips(articles.filter(a => a.type === 'video'));

            } catch (error) {
                console.error('Error fetching education content:', error);
                showError(featuredArticlesContainer, `Failed to load education content: ${error.message}`);
                showError(quickTipsContainer, '');
            }
        };

        const renderFeaturedArticles = (articles) => {
            if (!featuredArticlesContainer) return;
            featuredArticlesContainer.innerHTML = '';
            if (!articles || articles.length === 0) {
                featuredArticlesContainer.innerHTML = '<div class="col-12 text-center p-4 text-muted">No articles found for this topic.</div>';
                return;
            }
            articles.forEach(article => {
                const col = document.createElement('div');
                col.className = 'col-md-6 col-lg-4';
                col.innerHTML = `
                    <div class="card shadow-sm-light h-100">
                        <img src="${article.thumbnail_url || 'https://via.placeholder.com/300x200?text=Article+Image'}" class="card-img-top" alt="Article Thumbnail">
                        <div class="card-body">
                            <h5 class="card-title">${article.title}</h5>
                            <p class="card-text small text-muted">${article.summary}</p>
                            <a href="#" class="btn btn-sm btn-outline-primary read-article-btn" data-article-id="${article.id}">Read More</a>
                        </div>
                    </div>
                `;
                featuredArticlesContainer.appendChild(col);
            });
            document.querySelectorAll('.read-article-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const articleId = e.target.dataset.articleId;
                    alert(`Reading article ${articleId} (simulated). This would open a modal or new page with full content.`);
                });
            });
        };

        const renderQuickTips = (videos) => {
            if (!quickTipsContainer) return;
            quickTipsContainer.innerHTML = '';
            if (!videos || videos.length === 0) {
                quickTipsContainer.innerHTML = '<div class="col-12 text-center p-4 text-muted">No video guides found for this topic.</div>';
                return;
            }
            videos.forEach(video => {
                const col = document.createElement('div');
                col.className = 'col-md-6';
                col.innerHTML = `
                    <div class="p-3 border rounded bg-light d-flex align-items-center shadow-sm-light">
                        <i class="fas fa-video fa-2x text-primary me-3"></i>
                        <div>
                            <h5 class="mb-0">${video.title}</h5>
                            <small class="text-muted">${video.summary}</small>
                        </div>
                        <i class="fas fa-chevron-right ms-auto text-muted play-video-btn" data-video-url="${video.video_url}"></i>
                    </div>
                `;
                quickTipsContainer.appendChild(col);
            });
            document.querySelectorAll('.play-video-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const videoUrl = e.target.dataset.videoUrl;
                    if (videoUrl) {
                        window.open(videoUrl, '_blank');
                    } else {
                        alert('Video URL not available.');
                    }
                });
            });
        };

        if (searchBtn) searchBtn.addEventListener('click', () => fetchAndRenderEducation(currentTopic, searchInput?.value));
        if (searchInput) searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') fetchAndRenderEducation(currentTopic, searchInput.value);
        });
        topicFilterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                topicFilterButtons.forEach(btn => {
                    btn.classList.remove('active', 'btn-outline-primary');
                    btn.classList.add('btn-outline-secondary'); // Reset to default style
                });
                e.target.classList.add('active', 'btn-outline-primary');
                currentTopic = e.target.textContent;
                fetchAndRenderEducation(currentTopic, searchInput?.value);
            });
        });
        // Ensure the initial "All Topics" button is correctly styled
        document.querySelector('.d-flex.flex-wrap.gap-2 button.btn-outline-primary.active')?.classList.add('btn-outline-primary');


        // Initial fetch for education content
        fetchAndRenderEducation('All Topics');
    }

    // 7. Settings Page (`settings.html`)
    const settingsPageH2 = document.querySelector('h2.mb-4');
    if (settingsPageH2 && settingsPageH2.textContent.includes('App Settings')) {
        const currentUserId = getUserId();
        const token = getToken();

        const firstNameInput = document.getElementById('inputFirstName');
        const lastNameInput = document.getElementById('inputLastName');
        const emailInput = document.getElementById('inputEmail');
        const saveProfileBtn = document.querySelector('#profileForm .btn-primary');
        const workoutRemindersSwitch = document.getElementById('flexSwitchWorkoutReminders');
        const progressAlertsSwitch = document.getElementById('flexSwitchProgressAlerts');
        const clientMessagesSwitch = document.getElementById('flexSwitchClientMessages');
        const saveNotificationsBtn = document.querySelector('.card:nth-of-type(2) .text-end .btn-primary');
        const changePasswordBtn = document.querySelector('.btn-outline-secondary i.fa-lock')?.closest('button');
        const deleteAccountBtn = document.querySelector('.btn-outline-danger i.fa-user-times')?.closest('button');

        const fetchUserProfile = async (userId) => {
            if (!userId) {
                showError(settingsPageH2.closest('.container-fluid'), 'Please log in to view settings.');
                return;
            }
            try {
                const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Unknown error.' }));
                    throw new Error(`HTTP error! status: ${response.status} - ${errorData.message}`);
                }
                const user = await response.json();

                if (firstNameInput) firstNameInput.value = user.firstName;
                if (lastNameInput) lastNameInput.value = user.lastName;
                if (emailInput) emailInput.value = user.email;
                if (workoutRemindersSwitch) workoutRemindersSwitch.checked = user.notificationPreferences.dailyWorkoutReminders;
                if (progressAlertsSwitch) progressAlertsSwitch.checked = user.notificationPreferences.progressMilestoneAlerts;
                if (clientMessagesSwitch) clientMessagesSwitch.checked = user.notificationPreferences.clientMessages;

                if (clientMessagesSwitch && user.role !== 'trainer') {
                    clientMessagesSwitch.closest('.form-check.form-switch.mb-4').style.display = 'none'; // Hide parent div
                }

            } catch (error) {
                console.error('Error fetching user profile:', error);
                alert(`Failed to load profile: ${error.message}`);
                showError(settingsPageH2.closest('.container-fluid'), `Failed to load profile: ${error.message}`);
            }
        };

        if (saveProfileBtn) saveProfileBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const updatedProfile = {
                firstName: firstNameInput?.value,
                lastName: lastNameInput?.value,
                email: emailInput?.value
            };
            try {
                const response = await fetch(`${API_BASE_URL}/users/${currentUserId}/profile`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(updatedProfile)
                });
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Failed to update profile.');
                }
                alert('Profile updated successfully!');
            } catch (error) {
                console.error('Error updating profile:', error);
                alert(`Error updating profile: ${error.message}`);
            }
        });

        if (saveNotificationsBtn) saveNotificationsBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const updatedPreferences = {
                dailyWorkoutReminders: workoutRemindersSwitch?.checked,
                progressMilestoneAlerts: progressAlertsSwitch?.checked,
                clientMessages: clientMessagesSwitch?.checked
            };
            try {
                const response = await fetch(`${API_BASE_URL}/users/${currentUserId}/notifications`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(updatedPreferences)
                });
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Failed to save notification preferences.');
                }
                alert('Notification preferences saved successfully!');
            } catch (error) {
                console.error('Error saving notifications:', error);
                alert(`Error saving notifications: ${error.message}`);
            }
        });

        if (changePasswordBtn) changePasswordBtn.addEventListener('click', async () => {
            const currentPassword = prompt('Enter your current password:');
            const newPassword = prompt('Enter your new password:');
            const confirmNewPassword = prompt('Confirm your new password:');

            if (!currentPassword || !newPassword || !confirmNewPassword) {
                alert('Password change cancelled.');
                return;
            }
            if (newPassword !== confirmNewPassword) {
                alert('New passwords do not match!');
                return;
            }
            if (newPassword.length < 6) {
                alert('New password must be at least 6 characters long.');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/users/${currentUserId}/password`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ currentPassword, newPassword })
                });
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Failed to change password.');
                }
                alert('Password changed successfully!');
            } catch (error) {
                console.error('Error changing password:', error);
                alert(`Error changing password: ${error.message}`);
            }
        });

        if (deleteAccountBtn) deleteAccountBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete your account? This action is irreversible.')) {
                try {
                    const response = await fetch(`${API_BASE_URL}/users/${currentUserId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.message || 'Failed to delete account.');
                    }
                    alert('Account deleted successfully!');
                    localStorage.clear();
                    window.location.href = '/index.html';
                } catch (error) {
                    console.error('Error deleting account:', error);
                    alert(`Error deleting account: ${error.message}`);
                }
            }
        });

        fetchUserProfile(currentUserId);
    }

    // --- Dummy Login/Logout for Development (REMOVE IN PRODUCTION) ---
    const devLoginButton = document.createElement('button');
    devLoginButton.textContent = 'DEV: Toggle Login (User/Trainer)';
    devLoginButton.style.position = 'fixed';
    devLoginButton.style.bottom = '20px';
    devLoginButton.style.left = '20px';
    devLoginButton.style.zIndex = '9999';
    devLoginButton.classList.add('btn', 'btn-warning', 'btn-sm');
    document.body.appendChild(devLoginButton);

    let loggedInAsUser = false; // Initial state for the toggle
    devLoginButton.addEventListener('click', () => {
        if (!loggedInAsUser) {
            // Simulate User Login (Danny's ID from init-db.js)
            localStorage.setItem('jwtToken', 'dummy_user_jwt_token_for_danny'); // Placeholder
            localStorage.setItem('userId', 'b6a8e5f0-d1c2-4b3a-9e0f-1a2b3c4d5e6f');
            localStorage.setItem('userRole', 'user');
            alert('Logged in as Dummy User (Danny).');
        } else {
            // Simulate Trainer Login (Julia's ID from init-db.js)
            localStorage.setItem('jwtToken', 'dummy_trainer_jwt_token_for_julia'); // Placeholder
            localStorage.setItem('userId', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d');
            localStorage.setItem('userRole', 'trainer');
            alert('Logged in as Dummy Trainer (Julia).');
        }
        loggedInAsUser = !loggedInAsUser;
        updateAuthUI(); // Update button text and sidebar links
        // Immediately reload relevant sections of the current page if it uses user data
        // For example, if on My Schedule, refetch data
        if (mySchedulePageH2 && mySchedulePageH2.textContent.includes('Your Weekly Workout Schedule')) {
            // This would need to refresh currentUserId and then call fetchAndRenderSchedule
            // For now, a full page reload is simplest for dummy login to take effect on page data
            window.location.reload();
        } else if (progressTrackPageH2 && progressTrackPageH2.textContent.includes('Your Fitness Progress')) {
            window.location.reload();
        } else if (clientsPageH2 && clientsPageH2.textContent.includes('Your Clients')) {
             window.location.reload();
        } else if (settingsPageH2 && settingsPageH2.textContent.includes('App Settings')) {
            window.location.reload();
        }
    });
});