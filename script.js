const recordBtn = document.getElementById("recordBtn");
const statusText = document.getElementById("status");
const resultDiv = document.getElementById("result");

// Initialize our audio processor
const audioProcessor = new AudioProcessor();

recordBtn.addEventListener("click", async () => {
  if (audioProcessor.recording) {
    // Stop recording
    recordBtn.textContent = "Start Recording";
    statusText.textContent = "Processing...";
    
    try {
      const audioBlob = await audioProcessor.stopRecording();
      
      // Create a File object from the blob
      const file = new File([audioBlob], "recording.wav", { type: "audio/wav" });
      
      // Prepare form data for submission
      const formData = new FormData();
      formData.append("audio", file);

      const response = await fetch("https://autothai.app.n8n.cloud/webhook-test/56f98949-4d7b-4ec3-a2b4-11923b65d5d7", {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      console.log('Webhook response:', data); // For debugging
      
      // Handle the array response from n8n
      if (Array.isArray(data) && data.length > 0 && data[0].output) {
        const parsedOutput = parseSimpleMarkdown(data[0].output);
        resultDiv.innerHTML = parsedOutput;
      } else {
        resultDiv.textContent = "No result returned.";
      }
      
      statusText.textContent = "Done!";
    } catch (err) {
      statusText.textContent = "Error: " + err.message;
      console.error("Recording error:", err);
    }
  } else {
    // Start recording
    try {
      await audioProcessor.startRecording();
      recordBtn.textContent = "Stop Recording";
      statusText.textContent = "Recording...";
    } catch (err) {
      statusText.textContent = "Error: " + err.message;
      console.error("Recording error:", err);
    }
  }
});

function parseSimpleMarkdown(text) {
    // Handle bold text (using ** or __)
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Handle italic text (using * or _)
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    text = text.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Handle links [text](url)
    text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // Handle lists
    // Split text into lines
    const lines = text.split('\n');
    const processedLines = lines.map(line => {
        // Unordered lists (- or *)
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
            return `<li>${line.trim().substring(2)}</li>`;
        }
        return line;
    });
    
    // Wrap consecutive list items in ul tags
    let inList = false;
    const finalLines = [];
    for (const line of processedLines) {
        if (line.startsWith('<li>')) {
            if (!inList) {
                finalLines.push('<ul>');
                inList = true;
            }
        } else if (inList) {
            finalLines.push('</ul>');
            inList = false;
        }
        finalLines.push(line);
    }
    if (inList) {
        finalLines.push('</ul>');
    }
    
    return finalLines.join('\n');
}
