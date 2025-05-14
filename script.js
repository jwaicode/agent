const recordBtn = document.getElementById("recordBtn");
const statusText = document.getElementById("status");
const resultDiv = document.getElementById("result");

let mediaRecorder;
let chunks = [];

recordBtn.addEventListener("click", async () => {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    recordBtn.textContent = "Start Recording";
    statusText.textContent = "Processing...";
  } else {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/mp3' });
    chunks = [];

    mediaRecorder.ondataavailable = e => chunks.push(e.data);

    mediaRecorder.onstop = async () => {
      // Create a blob from the recorded audio chunks
      const mimeType = 'audio/mp3';
      const fileExt = 'mp3';
      const blob = new Blob(chunks, { type: mimeType });
      
      // Create a File object from the blob with proper name and type
      const file = new File([blob], `recording.${fileExt}`, { type: mimeType });
      
      // Prepare form data for submission
      const formData = new FormData();
      formData.append("audio", file);

      try {
        const response = await fetch("https://autothai.app.n8n.cloud/webhook-test/56f98949-4d7b-4ec3-a2b4-11923b65d5d7", {
          method: "POST",
          body: formData
        });

        const data = await response.json();
        resultDiv.textContent = data.ai_msg.output || "No result returned.";
        statusText.textContent = "Done!";
      } catch (err) {
        statusText.textContent = "Error: " + err.message;
      }
    };

    mediaRecorder.start();
    recordBtn.textContent = "Stop Recording";
    statusText.textContent = "Recording...";
  }
});
