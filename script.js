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

      const response = await fetch("https://autothai.app.n8n.cloud/webhook-test/a39dd63e-d8b4-44d0-9136-508b14eb5814", {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      resultDiv.innerHTML = data.output || "No result returned.";
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
