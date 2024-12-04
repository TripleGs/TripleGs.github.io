let tagsData = {}; // Store tags data globally
let searchIndex; // FlexSearch index
let filteredFiles = []; // Store filtered files based on the search query
let currentIndex = 0; // Track the current index for pagination
const batchSize = 10; // Number of items to load at a time
// Global variable to store unique tags
let uniqueTags = new Set();
let selectedTags = []; // Track all selected tags


// Initialize FlexSearch index
function initializeIndex() {
    searchIndex = new FlexSearch.Document({
        tokenize: "forward",
        threshold: 5,        // Controls typo tolerance
        depth: 3,            // Depth of fuzzy matching
        document: {
            id: "file",
            index: ["file", "tags", "description"],
            store: ["file", "description", "header"]
        }
    });

}

async function loadTags() {
    try {
        const response = await fetch('tags.json'); // Ensure tags.json is accessible
        if (!response.ok) throw new Error("Failed to fetch tags data");
        tagsData = await response.json();

        initializeIndex(); // Initialize FlexSearch index

        // Add each item in tagsData to the FlexSearch index
        for (const [file, data] of Object.entries(tagsData)) {
            data.tags.forEach(tag => uniqueTags.add(tag)); // Collect unique tags
            searchIndex.add({
                file: file,
                tags: data.tags.join(" "), // Combine tags into a single string
                description: data.description,
                header: data.header // Add header for use in results
            });
        }

        searchFiles(); // Display the initial batch of items
    } catch (error) {
        console.error("Error loading tags:", error);
    }
}

// Call the function to load tags on page load
loadTags();

function searchFiles() {
    const query = document.getElementById("field").value.toLowerCase().trim();
    currentIndex = 0; // Reset index for new search
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = ""; // Clear previous results
    filteredFiles = []; // Reset filtered files array

    // Use FlexSearch to perform the search and retrieve matching items
    if (query) {
        const results = searchIndex.search(query, { limit: 100 }); // Retrieve up to 100 results for pagination

        // Use a Set to track unique file IDs and avoid duplicates
        const uniqueFiles = new Set();

        results.forEach(result => {
            result.result.forEach(id => {
                if (!uniqueFiles.has(id)) {
                    uniqueFiles.add(id); // Track as seen
                    const data = searchIndex.store[id];
                    if (data) {
                        filteredFiles.push({
                            file: data.file,
                            description: data.description,
                            header: data.header // Ensure header is included
                        });
                    }
                }
            });
        });
    } else {
        // Show all files if query is empty
        filteredFiles = Object.entries(tagsData).map(([file, data]) => ({
            file,
            description: data.description,
            header: data.header // Include header here as well
        }));
    }

    loadMoreResults(); // Load the first batch of results
}


function loadMoreResults() {
    const resultsContainer = document.getElementById("results");

    // Get the next batch of files
    const nextBatch = filteredFiles.slice(currentIndex, currentIndex + batchSize);
    nextBatch.forEach(({ file, description, header }) => {
        const link = document.createElement("a");
        link.href = `content/${file}`;
        const resultBlock = document.createElement("div");
        resultBlock.classList.add("result-block");

        const title = document.createElement("h2");
        title.textContent = header || file; // Use the header if available, fallback to file

        const desc = document.createElement("p");
        desc.textContent = description;

        resultBlock.appendChild(title);
        resultBlock.appendChild(desc);
        link.appendChild(resultBlock)
        resultsContainer.appendChild(link);
    });

    // Update the current index
    currentIndex += batchSize;

    // Check if there are more items to load
    if (currentIndex < filteredFiles.length) {
        observeLastItem();
    }
}

// Function to observe the last item in the results list
function observeLastItem() {
    const resultsContainer = document.getElementById("results");
    const items = resultsContainer.getElementsByClassName("result-block");
    const lastItem = items[items.length - 1];

    if (window.loadObserver) window.loadObserver.disconnect();

    window.loadObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            loadMoreResults();
        }
    });

    if (lastItem) window.loadObserver.observe(lastItem);
}

// Listen for input changes in the search field and update results in real-time
document.getElementById("field").addEventListener("input", searchFiles);

function showFilterMenu() {
    const filterMenu = document.getElementById("filterMenu");

    // Toggle visibility of the filter menu
    if (filterMenu.style.display === "none" || filterMenu.style.display === "") {
        filterMenu.style.display = "block"; // Show the filter menu
    } else {
        filterMenu.style.display = "none"; // Hide the filter menu
        return; // Stop further execution to avoid regenerating buttons
    }

    filterMenu.innerHTML = ""; // Clear existing buttons

    uniqueTags.forEach(tag => {
        const button = document.createElement("button");
        button.classList.add("filter-button");
        button.textContent = tag;
        button.onclick = () => filterByTag(tag); // Attach click event for filtering
        filterMenu.appendChild(button);

    });

    // Reapply highlights to the selected button
    updateFilterButtonHighlights();
}


function filterByTag(tag) {
    currentIndex = 0; // Reset pagination index

    // Toggle the tag in the selectedTags array
    if (selectedTags.includes(tag)) {
        // Remove the tag if it's already selected
        selectedTags = selectedTags.filter(t => t !== tag);
    } else {
        // Add the tag if it's not already selected
        selectedTags.push(tag);
    }

    // Filter files by selected tags
    if (selectedTags.length > 0) {
        filteredFiles = Object.entries(tagsData)
            .filter(([_, data]) =>
                selectedTags.every(tag => data.tags.includes(tag)) // Match all selected tags
            )
            .map(([file, data]) => ({
                file,
                description: data.description,
                header: data.header
            }));
    } else {
        // Show all files if no tags are selected
        filteredFiles = Object.entries(tagsData).map(([file, data]) => ({
            file,
            description: data.description,
            header: data.header
        }));
    }

    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = ""; // Clear previous results
    loadMoreResults(); // Load filtered results

    // Update button highlights
    updateFilterButtonHighlights();
}


function updateFilterButtonHighlights() {
    const buttons = document.querySelectorAll(".filter-button");
    buttons.forEach(button => {
        if (selectedTags.includes(button.textContent)) {
            button.classList.add("selected"); // Highlight the selected button
        } else {
            button.classList.remove("selected"); // Remove highlight from non-selected buttons
        }
    });
}

function clearSelectedTags() {
    selectedTags = []; // Clear all selected tags
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = ""; // Clear previous results

    // Show all files
    filteredFiles = Object.entries(tagsData).map(([file, data]) => ({
        file,
        description: data.description,
        header: data.header
    }));
    loadMoreResults(); // Load all results

    updateFilterButtonHighlights(); // Update highlights
}


// Attach event listener to the Filter button
document.getElementById("button").addEventListener("click", showFilterMenu);

