let recognition;

function startRecognition() {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript;
        document.getElementById('user-input').value = transcript;
    };

    recognition.start();
}

function stopRecognition() {
    if (recognition) {
        recognition.stop();
        recognition = null;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const sendButton = document.getElementById('send-button');
    const userInput = document.getElementById('user-input');
    const chatHistory = document.getElementById('chat-history');
    const historyList = document.getElementById('history-list');
    const generateImageCheckbox = document.getElementById('imageCheckbox');
    const emojisCheckbox = document.getElementById('emojis');

    const micButton = document.getElementById('mic-button');
    const cameraButton = document.getElementById('camera-button');
    const imageInput = document.getElementById('image-input');
    const imagePreview = document.getElementById('image-preview');
    const imageDisplay = document.getElementById('image-display');
    const removeImage = document.getElementById('remove-image');

    sendButton.disabled = true;
    sendButton.style.backgroundColor = "#aaaaaa";
    sendButton.style.color = "#333";
    sendButton.style.cursor = "default"

    // Function to check inputs and enable/disable send button
    function checkInputs() {
        const message = userInput.value.trim();
        const imageFile = imageInput.files[0];
        sendButton.disabled = !(message || imageFile);

        // Toggle class based on disabled state
        if (!sendButton.disabled) {
            sendButton.style.backgroundColor = "#742772";
            sendButton.style.color = "#fff";
            sendButton.style.cursor = "pointer"
        } 
        else {
            sendButton.style.backgroundColor = "#aaaaaa";
            sendButton.style.color = "#333";
            sendButton.style.cursor = "default"
        }
    }

    userInput.addEventListener('input', checkInputs); // Listen for text input changes
    imageInput.addEventListener('change', checkInputs); // Listen for file input changes

    let recognizing = false;

    micButton.addEventListener('click', () => {
        if (!recognizing) {
            startRecognition();
            recognizing = true;
        } else {
            stopRecognition();
            recognizing = false;
        }
    });

    cameraButton.addEventListener('click', () => {
        imageInput.click();
    });

    imageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imageDisplay.src = e.target.result;
                imagePreview.style.display = 'block';
                cameraButton.style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    });

    removeImage.addEventListener('click', () => {
        imagePreview.style.display = 'none';
        cameraButton.style.display = 'inline';
        imageInput.value = '';
        imageDisplay.src = '';
    });

    sendButton.addEventListener('click', () => {
        const message = userInput.value.trim();
        const imageFile = imageInput.files[0];

        if (message || imageFile) {
            const timestamp = new Date();
            appendMessage('user', message, imageFile, timestamp);
            userInput.value = '';
            imagePreview.style.display = 'none';
            cameraButton.style.display = 'inline';
            imageInput.value = '';
            imageDisplay.src = '';
            sendButton.disabled = true;
            sendButton.style.backgroundColor = "#aaaaaa";
            sendButton.style.color = "#333";
            sendButton.style.cursor = "default"
            fetchResponse(message, gatherInputs(), imageFile, timestamp);
        }
    });

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendButton.click();
        }
    });

    function gatherInputs() {
        const headingDescription = document.getElementById('headingDes').value;
        const keywords = document.getElementById('keywords').value;
        const emojis = emojisCheckbox.checked;
        const formality = document.getElementById('formalitySlider').value;
        const wordCount = document.getElementById('wordCount').value;
        const language = document.getElementById('languageSelect').value;
        const socialMedia = document.getElementById('socialMediaSelect').value;
        const contentType = document.getElementById('contentTypeSelect').value;
        const generateImage = generateImageCheckbox.checked;

        return {
            headingDescription,
            keywords,
            emojis,
            formality,
            wordCount,
            language,
            socialMedia,
            contentType,
            generateImage
        };
    }

    function showLoading(combinedDiv) {
        const loadingGif = document.createElement('img');
        loadingGif.src = 'static/images/loading.gif';
        loadingGif.classList.add('loading-gif');
        combinedDiv.insertBefore(loadingGif, combinedDiv.firstChild);
    }

    function removeLoading() {
        const loadingGif = document.querySelector('.loading-gif');
        if (loadingGif) {
            loadingGif.remove();
        }
    }

    function fetchResponse(message, inputs, imageFile, timestamp) {
        const combinedInput = message + (imageFile ? imageFile.name + imageFile.size : ''); // Creating a unique ID
    
        let textElement = null;
        let imageElement = null;
        const combinedDiv = document.createElement('div');
        combinedDiv.classList.add('chat-message', 'bot-message');
        chatHistory.appendChild(combinedDiv);
    
        const loadingGif = document.createElement('img');
        loadingGif.src = 'static/images/loading.gif';
        loadingGif.classList.add('loading-gif');
        combinedDiv.appendChild(loadingGif);
        combinedDiv.scrollIntoView({ behavior: 'smooth' });

        // Check if wordCount value is provided, if not use the numeric part of the placeholder
        let wordCountValue = inputs.wordCount || extractNumericPlaceholder();
    
        const formData = new FormData();
        formData.append('uniqueId', combinedInput); // Sending unique ID to backend
        formData.append('message', message);
        formData.append('headingDescription', inputs.headingDescription);
        formData.append('keywords', inputs.keywords);
        formData.append('emojis', inputs.emojis);
        formData.append('formality', inputs.formality);
        formData.append('wordCount', wordCountValue);
        formData.append('language', inputs.language);
        formData.append('socialMedia', inputs.socialMedia);
        formData.append('contentType', inputs.contentType);
        if (imageFile) {
            formData.append('image', imageFile);
        }
    
        const formattedTimestamp = `${padZero(timestamp.getDate())}-${padZero(timestamp.getMonth() + 1)}-${timestamp.getFullYear()} ${padZero(timestamp.getHours())}:${padZero(timestamp.getMinutes())}:${padZero(timestamp.getSeconds())}`;
        formData.append('timestamp', formattedTimestamp);
    
        const textPromise = fetch('/text-chat', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            textElement = createTextElement(data.text);
            if (imageElement) {
                appendCombinedResponse(combinedDiv, imageElement, textElement);
                removeLoading();
            } else {
                appendCombinedResponse(combinedDiv, null, textElement);
                if (inputs.generateImage) {
                    showLoading(combinedDiv);
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            textElement = createTextElement('Network or server error. Please try again later.', true);
            appendCombinedResponse(combinedDiv, null, textElement);
        });
    
        const imagePromise = inputs.generateImage
            ? fetch('/image-chat', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.img) {
                    imageElement = createImageElement(data.img);
                    appendCombinedResponse(combinedDiv, imageElement, textElement);
                    removeLoading();
                }
            })
            .catch(error => {
                console.error('Error:', error);
                const errorImageElement = createImageElement('static/images/imgCrash.jpg');
                appendCombinedResponse(combinedDiv, errorImageElement, textElement);
                removeLoading();
            })
            : Promise.resolve();
    
        Promise.all([textPromise, imagePromise]).then(() => {
            removeLoading();
        });
    }    

    function extractNumericPlaceholder() {
        const wordCountInput = document.getElementById('wordCount');
        const placeholderText = wordCountInput.placeholder;
        const numericValue = placeholderText.match(/\d+/); // Extract the numeric part of the placeholder
        return numericValue ? numericValue[0] : '200'; // Default to '200' if no numeric value is found
    }

    function padZero(num) {
        return (num < 10 ? '0' : '') + num;
    }

    function createIconButton(iconClass, clickHandler) {
        const button = document.createElement('button');
        button.classList.add(`${iconClass}-button`);
        button.innerHTML = `<i class="fas fa-${iconClass}"></i>`;
        button.addEventListener('click', clickHandler);
        return button;
    }

    function createTextElement(textResponse, isError = false) {
        const textElement = document.createElement('div');
        textElement.innerHTML = textResponse;
    
        if (!isError) {
            const iconContainer = document.createElement('div');
            iconContainer.classList.add('icon-container');
    
            const copyButton = createIconButton('copy', () => {
                const tempElement = document.createElement('div');
                tempElement.innerHTML = textResponse;
                const paragraphs = tempElement.querySelectorAll('p');
                let plainText = '';
                paragraphs.forEach(paragraph => {
                    plainText += paragraph.innerText + '\n\n';
                });
                plainText = plainText.trim();
                navigator.clipboard.writeText(plainText).then(() => {
                    const copiedMessage = document.createElement('span');
                    copiedMessage.classList.add('copied-message');
                    copiedMessage.textContent = 'Text copied';
                    iconContainer.insertBefore(copiedMessage, copyButton);
                    setTimeout(() => {
                        copiedMessage.remove();
                    }, 2000);
                });
            });
    
            const playButton = createIconButton('volume-up', () => {
                togglePlayPause(textResponse, playButton, pauseButton, stopButton);
            });
            const pauseButton = createIconButton('pause', () => {
                speechSynthesis.pause();
                togglePlayPause(null, playButton, pauseButton, stopButton);
            });
            const stopButton = createIconButton('stop', () => {
                speechSynthesis.cancel();
                togglePlayPause(null, playButton, pauseButton, stopButton);
            });
            pauseButton.style.display = 'none';
            stopButton.style.display = 'none';
    
            const editButton = createIconButton('edit', () => {
                openEditDialog(textElement);
            });
    
            const shareButton = createIconButton('share', () => {
                toggleTooltip(shareButton, textResponse);
            });
     
    
            iconContainer.appendChild(copyButton);
            iconContainer.appendChild(playButton);
            iconContainer.appendChild(pauseButton);
            iconContainer.appendChild(stopButton);
            iconContainer.appendChild(editButton);
            iconContainer.appendChild(shareButton);
    
            textElement.appendChild(iconContainer);
        }
    
        return textElement;
    }    

    function openEditDialog() {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.classList.add('dialog-overlay');
    
        // Create dialog box
        const dialog = document.createElement('div');
        dialog.classList.add('dialog-box');
    
        // Message content
        const message = document.createElement('p');
        message.textContent = 'The function to edit and schedule posts will be available in the upcoming version of Likhlo Creators.';
    
        // Close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.addEventListener('click', () => {
            overlay.remove(); // Remove the overlay when close button is clicked
        });
    
        // Append elements to the dialog box
        dialog.appendChild(message);
        dialog.appendChild(closeButton);
    
        // Append dialog box to overlay
        overlay.appendChild(dialog);
    
        // Append overlay to document body
        document.body.appendChild(overlay);
    }
    
    let utterance = null;
    let isPaused = false;

    function togglePlayPause(text, playButton, pauseButton, stopButton) {
        if (speechSynthesis.speaking && !speechSynthesis.paused) {
            speechSynthesis.pause();
            isPaused = true;
            playButton.style.display = 'inline-block';
            pauseButton.style.display = 'none';
            stopButton.style.display = 'inline-block';
        } else {
            if (text && !isPaused) {
                utterance = new SpeechSynthesisUtterance(text);
                const voices = window.speechSynthesis.getVoices();
                let femaleVoice = voices.find(voice => voice.lang.startsWith('en-') && voice.name.toLowerCase().includes('female'));
                if (!femaleVoice) {
                    femaleVoice = voices.find(voice => voice.lang.startsWith('en-'));
                }
                if (femaleVoice) {
                    utterance.voice = femaleVoice;
                } else {
                    console.warn('No female voice found for speech synthesis.');
                }
                speechSynthesis.speak(utterance);
            } else if (isPaused) {
                speechSynthesis.resume();
            }
            isPaused = false;
            playButton.style.display = 'none';
            pauseButton.style.display = 'inline-block';
            stopButton.style.display = 'inline-block';

            utterance.onend = () => {
                playButton.style.display = 'inline-block';
                pauseButton.style.display = 'none';
                stopButton.style.display = 'none';
            };

            utterance.onerror = () => {
                playButton.style.display = 'inline-block';
                pauseButton.style.display = 'none';
                stopButton.style.display = 'none';
            };
        }
    }

    function createImageElement(imageUrl, isBotMessage = true) {
        const imageContainer = document.createElement('div');
        imageContainer.classList.add('image-container');
    
        const imageElement = document.createElement('img');
        imageElement.src = imageUrl;
        imageElement.classList.add('response-image');
    
        if (isBotMessage) {
            const downloadButton = createIconButton('download', () => {
                downloadButton.style.backgroundColor = 'red'; // Change the button color to red
                
                fetch('/download-image', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ imageUrl: imageUrl })
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.blob();
                })
                .then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = 'likhlo_image.png';
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    downloadButton.style.backgroundColor = ''; // Revert the button color
                })
                .catch(error => {
                    console.error('Download error:', error);
                    downloadButton.style.backgroundColor = ''; // Revert the button color in case of error
                });
            });                
    
            imageContainer.appendChild(downloadButton);
        }
    
        imageContainer.appendChild(imageElement);
    
        return imageContainer;
    }        

    function appendMessage(sender, message, imageFile) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message', `${sender}-message`);
    
        if (imageFile) {
            const imageUrl = URL.createObjectURL(imageFile);
            const isBotMessage = sender === 'bot'; // Adjust as per your sender logic
            const imageElement = createImageElement(imageUrl, isBotMessage);
            messageDiv.appendChild(imageElement);
        }
        if (message) {
            const textDiv = document.createElement('div');
            textDiv.textContent = message;
            messageDiv.appendChild(textDiv);
        }

        const timeElement = createTimeElement();
        timeElement.style.display = 'none'; // Initially hide the timestamp
        messageDiv.appendChild(timeElement);
    
        chatHistory.appendChild(messageDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
        addToHistory(sender, message || 'Image');
        messageDiv.scrollIntoView({ behavior: 'smooth' });
    }    

    function appendCombinedResponse(combinedDiv, imageElement, textElement) {
        combinedDiv.innerHTML = '';

        if (imageElement) {
            combinedDiv.appendChild(imageElement);
        }
        if (textElement) {
            combinedDiv.appendChild(textElement);
        }

        const timeElement = createTimeElement();
        timeElement.style.display = 'none'; // Initially hide the timestamp
        combinedDiv.appendChild(timeElement);

        combinedDiv.scrollIntoView({ behavior: 'smooth' });

    }

    function createTimeElement() {
        const now = new Date();
        const timeString = `${formatTime(now)} ${formatDate(now)}`;
        const timeElement = document.createElement('div');
        timeElement.classList.add('message-time');
        timeElement.textContent = timeString;
        return timeElement;
    }

    function formatTime(date) {
        return `${padZero(date.getHours())}:${padZero(date.getMinutes())}:${padZero(date.getSeconds())}`;
    }

    function formatDate(date) {
        const day = padZero(date.getDate());
        const month = padZero(date.getMonth() + 1);
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }

    function padZero(num) {
        return (num < 10 ? '0' : '') + num;
    }
    
    function addToHistory(sender, message) {
        const historyItem = document.createElement('li');
        historyItem.classList.add(`${sender}-history-item`);
        historyItem.textContent = message;
        historyList.appendChild(historyItem);
    }

    function toggleTooltip(button, content) {
        let tooltip = button.querySelector('.tooltip');
        if (!tooltip) {
            tooltip = document.createElement('span');
            tooltip.classList.add('tooltip');
    
            const sanitizedContent = sanitizeContent(content); // Sanitize content before sharing
    
            const socialMediaOptions = [
                { name: 'Facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(sanitizedContent)}` },
                { name: 'WhatsApp', url: `https://api.whatsapp.com/send?text=${encodeURIComponent(sanitizedContent)}` },
                { name: 'Twitter', url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(sanitizedContent)}` },
                { name: 'LinkedIn', url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(sanitizedContent)}` }
            ];
    
            socialMediaOptions.forEach(option => {
                const link = document.createElement('a');
                link.href = option.url;
                link.textContent = option.name;
                link.target = '_blank';
                link.style.display = 'block';
                tooltip.appendChild(link);
            });
    
            button.appendChild(tooltip);
        } else {
            tooltip.remove();
        }
    }
    
    function sanitizeContent(content) {
        // Remove <p> and </p> tags and format text appropriately
        const tempElement = document.createElement('div');
        tempElement.innerHTML = content;
        const paragraphs = tempElement.querySelectorAll('p');
        let plainText = '';
        paragraphs.forEach(paragraph => {
            plainText += paragraph.innerText + '\n\n';
        });
        return plainText.trim();
    }

    // Function to fetch and display chat history
    function loadChatHistory() {
        fetch('/chat-history')
            .then(response => response.json())
            .then(data => {
                data.forEach((chat, index) => {
                    // Create user message container
                    const userMessageDiv = document.createElement('div');
                    userMessageDiv.classList.add('chat-message', 'user-message');
    
                    if (chat.input_image) {
                        const inputImageElement = createImageElement(chat.input_image, false);
                        userMessageDiv.appendChild(inputImageElement);
                    }
    
                    if (chat.input_message) {
                        const inputMessageElement = document.createElement('p');
                        inputMessageElement.textContent = chat.input_message;
                        userMessageDiv.appendChild(inputMessageElement);
                    }
    
                    // Create bot message container
                    const botMessageDiv = document.createElement('div');
                    botMessageDiv.classList.add('chat-message', 'bot-message');
    
                    if (chat.bot_image) {
                        const botImageElement = createImageElement(chat.bot_image);
                        botMessageDiv.appendChild(botImageElement);
                    }
    
                    if (chat.bot_message) {
                        const botMessageElement = document.createElement('div');
                        botMessageElement.innerHTML = chat.bot_message;
                        botMessageDiv.appendChild(botMessageElement);
    
                        const iconContainer = document.createElement('div');
                        iconContainer.classList.add('icon-container');
    
                        const copyButton = createIconButton('copy', () => {
                            const tempElement = document.createElement('div');
                            tempElement.innerHTML = chat.bot_message;
                            const paragraphs = tempElement.querySelectorAll('p');
                            let plainText = '';
                            paragraphs.forEach(paragraph => {
                                plainText += paragraph.innerText + '\n\n';
                            });
                            plainText = plainText.trim();
                            navigator.clipboard.writeText(plainText).then(() => {
                                const copiedMessage = document.createElement('span');
                                copiedMessage.classList.add('copied-message');
                                copiedMessage.textContent = 'Text copied';
                                iconContainer.insertBefore(copiedMessage, copyButton);
                                setTimeout(() => {
                                    copiedMessage.remove();
                                }, 2000);
                            });
                        });
    
                        const playButton = createIconButton('volume-up', () => {
                            togglePlayPause(chat.bot_message, playButton, pauseButton, stopButton);
                        });
                        const pauseButton = createIconButton('pause', () => {
                            speechSynthesis.pause();
                            togglePlayPause(null, playButton, pauseButton, stopButton);
                        });
                        const stopButton = createIconButton('stop', () => {
                            speechSynthesis.cancel();
                            togglePlayPause(null, playButton, pauseButton, stopButton);
                        });
                        pauseButton.style.display = 'none';
                        stopButton.style.display = 'none';
    
                        const editButton = createIconButton('edit', () => {
                            openEditDialog(chat.bot_message);
                        });
    
                        const shareButton = createIconButton('share', () => {
                            toggleTooltip(shareButton, chat.bot_message);
                        });
    
                        iconContainer.appendChild(copyButton);
                        iconContainer.appendChild(playButton);
                        iconContainer.appendChild(pauseButton);
                        iconContainer.appendChild(stopButton);
                        iconContainer.appendChild(editButton);
                        iconContainer.appendChild(shareButton);
    
                        botMessageElement.appendChild(iconContainer);
                    }
    
                    // Append user and bot messages to chat history
                    chatHistory.appendChild(userMessageDiv);
                    chatHistory.appendChild(botMessageDiv);
    
                    // Scroll the last message into view
                    if (index === data.length - 1) {
                        botMessageDiv.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            })
            .catch(error => console.error('Error fetching chat history:', error));
    }    

// Load chat history on page load
loadChatHistory();

});
