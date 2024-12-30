// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "REDACTED",
    authDomain: "likhlo-ai.firebaseapp.com",
    projectId: "likhlo-ai",
    storageBucket: "likhlo-ai.appspot.com",
    messagingSenderId: "1010269402554",
    appId: "1:1010269402554:web:424ee4825b5b7e67bfd983",
    measurementId: "G-YMNQCZ1TG1"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Google Sign-In function
function googleSignIn() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            var user = result.user;

            // Fetch profile image URL
            var profileImage = user.photoURL;

            fetch('/google-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    'uid': user.uid,
                    'email': user.email,
                    'profileImage': profileImage // Send profile image to backend
                })
            }).then(response => {
                if (response.ok) {
                    // Save the profile image URL in localStorage/sessionStorage if needed
                    localStorage.setItem('profileImage', profileImage);
                    
                    window.location.href = '/';
                } else {
                    alert('Google login failed');
                }
            }).catch(error => {
                console.error('Error fetching:', error);
                alert('Google login failed');
            });
        }).catch((error) => {
            console.error('Error signing in with Google:', error);
            alert('Google login failed');
        });
}

// Logout function
function logout() {
    firebase.auth().signOut()
        .then(() => {
            // Remove profile image URL from localStorage
            localStorage.removeItem('profileImage');
            
            // Redirect to login or home page
            window.location.href = '/';
        })
        .catch((error) => {
            console.error('Error signing out:', error);
            alert('Logout failed');
        });
}

