function contentPlanner() {
    window.location.href = 'contentPlanner'
}

function calendarView() {
    window.location.href = 'calendarView'
}


document.addEventListener('DOMContentLoaded', function () {
    // JavaScript to toggle the menu
    document.querySelector('.navbar-toggle').addEventListener('click', function () {
        document.querySelector('.navbar-links').classList.toggle('show');
    }); 
});

document.addEventListener('DOMContentLoaded', function () {
    // Select the logo element
    var logo = document.getElementById('loading-logo');

    // Flag to check if the fadeUp animation is complete
    var fadeUpComplete = false;

    // Listen for the end of the fadeUp animation
    logo.addEventListener('animationend', function () {
        fadeUpComplete = true;

        // Check if both conditions are met before executing the window onload function
        if (fadeUpComplete && document.readyState === 'complete') {
            // Add a 0.5-second delay
            setTimeout(function () {
                // Hide the loading logo and text
                logo.style.display = 'none';

                // Show the main content
                document.getElementById('main-content').style.display = 'block';
            }, 500);
        }
    });

    // Check if all components of the main body are loaded
    if (document.readyState === 'complete') {
        fadeUpComplete = true;

        // Add a 0.5-second delay
        setTimeout(function () {
            // Hide the loading logo and text
            logo.style.display = 'none';

            // Show the main content
            document.getElementById('main-content').style.display = 'block';
        }, 500);
    }
});                        
