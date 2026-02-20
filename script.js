//script.js
document.addEventListener("DOMContentLoaded", function() {
    // Get the form, file input, and file list container
    const form = document.getElementById("applicationForm");
    const uploadInput = document.getElementById('upload');  // Correct the id to 'upload'
    const fileListContainer = document.getElementById("fileList");

    // Dynamically update the year in the footer
    document.getElementById("currentYear").textContent = new Date().getFullYear();

    // Store all uploaded files in an array
    let allFiles = [];

    // Listen for file selection changes
    uploadInput.addEventListener("change", function() {
        // Get the selected files from the current input
        const files = Array.from(uploadInput.files);

        // Add the new files to the allFiles array
        allFiles = allFiles.concat(files);

        // Clear the existing list in the container (to rebuild it with all files)
        fileListContainer.innerHTML = "";

        // Create an unordered list element to display the file names
        const ul = document.createElement("ul");

        // Loop through all files and create list items for each file
        for (let i = 0; i < allFiles.length; i++) {
            const li = document.createElement("li");
            li.textContent = allFiles[i].name;
            ul.appendChild(li);
        }

        // Append the list to the container
        fileListContainer.appendChild(ul);
    });

    // Add an event listener for the form submission
// Add an event listener for the form submission
form.addEventListener("submit", function(event) {
    event.preventDefault(); // Prevent the default form submission behavior

    // Create a FormData object to gather all form data
    const formData = new FormData(form);

      // Log all form data
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
    }

    
    console.log('Before fetch');
    fetch("http://localhost:3000/submit", {
        method: "POST",
        body: formData
    })
    .then(response => {
        console.log('Full fetch response:', response);  // Log full response for debugging
        console.log('Fetch response status:', response.status);
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        return response.json();  // Assuming your server responds with JSON
    })
    .then(result => {
        console.log('Form successfully submitted:', result);
        alert('Form submitted successfully!');
        form.reset();
        fileListContainer.innerHTML = "";
        allFiles = [];
    })
    .catch(error => {
        console.error('Error submitting form:', error);
        alert(`Error submitting form: ${error.message}`);  // Display more detailed error to the user
    });
});


});
