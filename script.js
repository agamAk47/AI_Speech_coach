// Replace with your Gemini API key
const GEMINI_API_KEY = "AIzaSyBYE4hRDfskZ9bxY1avf972xnwQGIQuYaQ"
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

// Sample practice texts
const practiceTexts = [
  "The quick brown fox jumps over the lazy dog. This classic pangram contains every letter of the English alphabet.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
  "The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle. - Steve Jobs",
  "In the middle of every difficulty lies opportunity. - Albert Einstein",
  "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
]

let mediaRecorder
let audioChunks = []
let isRecording = false
let audioContext
let microphone
let scriptProcessor
let hasDetectedSpeech = false
const audioLevelDisplay = document.createElement("div")
audioLevelDisplay.className = "audio-level-display"
audioLevelDisplay.style.cssText =
  "position: fixed; bottom: 20px; right: 20px; background: rgba(0,0,0,0.7); color: white; padding: 10px; border-radius: 5px; z-index: 1000; font-family: monospace;"
document.body.appendChild(audioLevelDisplay)

const TOTAL_EXERCISES = 5
let currentExerciseIndex = 0
let completedExercises = 0
let exerciseScores = Array(TOTAL_EXERCISES).fill(null)
let previousAccuracy = 0
let isRepeating = false

// DOM Elements
const startBtn = document.getElementById("start-btn")
const stopBtn = document.getElementById("stop-btn")
const newTextBtn = document.getElementById("new-text-btn")
const repeatBtn = document.getElementById("repeat-btn")
const prevExerciseBtn = document.getElementById("prev-exercise")
const nextExerciseBtn = document.getElementById("next-exercise")
const practiceText = document.getElementById("practice-text")
const feedback = document.getElementById("feedback")
const recordingIndicator = document.getElementById("recording-indicator")
const repeatingStatus = document.getElementById("repeating-status")
const progressFill = document.getElementById("progress-fill")
const completedExercisesSpan = document.getElementById("completed-exercises")
const totalExercisesSpan = document.getElementById("total-exercises")
const avgAccuracySpan = document.getElementById("avg-accuracy")
const improvementSpan = document.getElementById("improvement")
const accuracyScore = document.getElementById("accuracy-score")
const scoreFill = document.getElementById("score-fill")
const accuracyValue = document.getElementById("accuracy-value")
const audioPlayer = document.getElementById("audio-player")
const audioPlayerContainer = document.getElementById("audio-player-container")
const downloadBtn = document.getElementById("download-btn")

let currentAudioBlob = null
let firstExerciseScore = null
const completionPage = document.getElementById("completion-page")
const startNewSessionBtn = document.getElementById("start-new-session")
const downloadSummaryBtn = document.getElementById("download-summary")

// Initialize progress
function initializeProgress() {
  currentExerciseIndex = 0
  completedExercises = 0
  exerciseScores = Array(TOTAL_EXERCISES).fill(null)
  previousAccuracy = 0
  isRepeating = false
  repeatingStatus.classList.add("hidden")
  updateProgressUI()
  updateStatsUI()
  updateNavigationButtons()
  updatePracticeText()
  resetFeedbackUI()
}

function resetFeedbackUI() {
  feedback.innerHTML = "<p>Your feedback will appear here after recording.</p>"
  accuracyScore.classList.add("hidden")
  audioPlayer.src = ""
  audioPlayerContainer.classList.add("hidden")
  currentAudioBlob = null
}

function updateProgressUI() {
  const progress = (completedExercises / TOTAL_EXERCISES) * 100
  progressFill.style.width = `${progress}%`
  completedExercisesSpan.textContent = completedExercises
  totalExercisesSpan.textContent = TOTAL_EXERCISES
}

function updateNavigationButtons() {
  prevExerciseBtn.disabled = currentExerciseIndex <= 0
  nextExerciseBtn.disabled = currentExerciseIndex >= TOTAL_EXERCISES - 1
  
  if (exerciseScores[currentExerciseIndex] === null && currentExerciseIndex < TOTAL_EXERCISES - 1) {
    nextExerciseBtn.disabled = true
  }
}

function showCurrentExerciseScore() {
  resetFeedbackUI()
  
  if (exerciseScores[currentExerciseIndex] !== null) {
    updateAccuracyUI(exerciseScores[currentExerciseIndex])
    feedback.innerHTML = `
      <p>You've already completed this exercise with an accuracy of ${exerciseScores[currentExerciseIndex]}%.</p>
      <p>Click "Repeat Exercise" to try again or "Start Recording" to overwrite your previous attempt.</p>
    `
  }
}

// Handle exercise navigation
prevExerciseBtn.addEventListener("click", () => {
  if (currentExerciseIndex > 0) {
    currentExerciseIndex--
    updatePracticeText()
    updateNavigationButtons()
    showCurrentExerciseScore()
  }
})

nextExerciseBtn.addEventListener("click", () => {
  if (currentExerciseIndex < TOTAL_EXERCISES - 1) {
    currentExerciseIndex++
    updatePracticeText()
    updateNavigationButtons()
    showCurrentExerciseScore()
  } else if (completedExercises === TOTAL_EXERCISES) {
    showCompletionPage()
  }
})

function updateStatsUI() {
  const validScores = exerciseScores.filter(score => score !== null)
  if (validScores.length > 0) {
    const averageAccuracy = validScores.reduce((a, b) => a + b, 0) / validScores.length
    const improvement = averageAccuracy - previousAccuracy

    avgAccuracySpan.textContent = `${Math.round(averageAccuracy)}%`
    improvementSpan.textContent = `${improvement > 0 ? "+" : ""}${Math.round(improvement)}%`
    improvementSpan.style.color = improvement >= 0 ? "#00C851" : "#ff4444"

    previousAccuracy = averageAccuracy
  }
}

function updateAccuracyUI(accuracy) {
  accuracyScore.classList.remove("hidden")
  scoreFill.style.width = `${accuracy}%`
  accuracyValue.textContent = accuracy
}

function getRandomPracticeText() {
  const randomIndex = Math.floor(Math.random() * practiceTexts.length)
  return practiceTexts[randomIndex]
}

function updatePracticeText() {
  practiceText.innerHTML = `<p>${getRandomPracticeText()}</p>`
}

// Speech Recognition Setup
async function setupSpeechRecognition() {
  try {
    console.log("Setting up speech recognition...")
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    })
    console.log("Microphone access granted")

    const audioTracks = stream.getAudioTracks()
    console.log("Available audio tracks:", audioTracks)
    audioTracks.forEach((track) => {
      console.log("Audio track settings:", track.getSettings())
      console.log("Audio track capabilities:", track.getCapabilities())
    })

    mediaRecorder = new MediaRecorder(stream, {
      mimeType: "audio/webm",
      audioBitsPerSecond: 128000,
    })
    console.log("MediaRecorder created")

    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)()
      console.log("AudioContext created, sample rate:", audioContext.sampleRate)

      microphone = audioContext.createMediaStreamSource(stream)
      console.log("MediaStreamSource created")

      scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1)
      microphone.connect(scriptProcessor)
      scriptProcessor.connect(audioContext.destination)
      console.log("ScriptProcessor connected")

      let maxLevel = 0
      let minLevel = 1
      let currentLevel = 0
      let speechFrames = 0
      let silenceFrames = 0

      scriptProcessor.onaudioprocess = (e) => {
        if (!isRecording) return

        const inputData = e.inputBuffer.getChannelData(0)
        let sum = 0
        let peak = 0
        for (let i = 0; i < inputData.length; i++) {
          const absValue = Math.abs(inputData[i])
          sum += absValue
          peak = Math.max(peak, absValue)
        }
        currentLevel = sum / inputData.length

        maxLevel = Math.max(maxLevel, currentLevel)
        minLevel = Math.min(minLevel, currentLevel)

        audioLevelDisplay.textContent =
          `Current: ${(currentLevel * 100).toFixed(2)}%\n` +
          `Peak: ${(peak * 100).toFixed(2)}%\n` +
          `Max: ${(maxLevel * 100).toFixed(2)}%\n` +
          `Min: ${(minLevel * 100).toFixed(2)}%\n` +
          `Speech Frames: ${speechFrames}\n` +
          `Silence Frames: ${silenceFrames}`

        console.log("Audio Analysis:", {
          current: (currentLevel * 100).toFixed(2) + "%",
          peak: (peak * 100).toFixed(2) + "%",
          max: (maxLevel * 100).toFixed(2) + "%",
          min: (minLevel * 100).toFixed(2) + "%",
          speechFrames,
          silenceFrames,
        })

        if (currentLevel > 0.001) {
          speechFrames++
          silenceFrames = 0
          if (speechFrames >= 5) {
            hasDetectedSpeech = true
            audioLevelDisplay.style.color = "#00ff00"
          }
        } else {
          silenceFrames++
          speechFrames = 0
          if (silenceFrames >= 10) {
            hasDetectedSpeech = false
            audioLevelDisplay.style.color = "#ff0000"
          }
        }
      }
    } catch (error) {
      console.error("Error setting up audio processing:", error)
    }

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data)
      console.log("Recording data available:", event.data.size, "bytes")
    }

    mediaRecorder.onstop = async () => {
      console.log("Recording stopped. Total chunks:", audioChunks.length)
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" })
      console.log("Created audio blob:", audioBlob.size, "bytes")

      if (!hasDetectedSpeech) {
        console.log("No speech detected in recording")
        feedback.innerHTML = '<p class="error">No speech detected. Please speak when recording.</p>'
        audioChunks = []
        return
      }

      console.log("Speech detected, analyzing...")
      await analyzeSpeech(audioBlob)
      audioChunks = []
    }

    startBtn.disabled = false
  } catch (error) {
    console.error("Error accessing microphone:", error)
    feedback.innerHTML =
      '<p class="error">Error accessing microphone. Please ensure you have granted microphone permissions.</p>'
  }
}

function startRecording() {
  console.log("Starting recording...")
  isRepeating = false
  repeatingStatus.classList.add("hidden")
  hasDetectedSpeech = false

  feedback.innerHTML = "<p>Recording in progress...</p>"
  accuracyScore.classList.add("hidden")
  audioPlayer.src = ""
  audioPlayerContainer.classList.add("hidden")
  currentAudioBlob = null

  mediaRecorder.start(100)
  isRecording = true
  startBtn.disabled = true
  stopBtn.disabled = false
  repeatBtn.disabled = true
  newTextBtn.disabled = true
  recordingIndicator.classList.remove("hidden")
}

function stopRecording() {
  console.log("Stopping recording...")
  mediaRecorder.stop()
  isRecording = false
  startBtn.disabled = false
  stopBtn.disabled = true
  repeatBtn.disabled = false
  newTextBtn.disabled = false
  recordingIndicator.classList.add("hidden")

  if (!isRepeating) {
    repeatingStatus.classList.add("hidden")
  }

  feedback.innerHTML = "<p>Processing your speech...</p>"
  audioLevelDisplay.style.color = "white"
}

async function analyzeSpeech(audioBlob) {
  let accuracy = 0
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const arrayBuffer = await audioBlob.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

    const channelData = audioBuffer.getChannelData(0)
    let sum = 0
    let maxAmplitude = 0
    let silenceCount = 0
    let speechCount = 0
    const totalSamples = channelData.length

    const chunkSize = 1024
    const speechThreshold = 0.01
    const noiseThreshold = 0.003

    for (let i = 0; i < totalSamples; i += chunkSize) {
      let chunkSum = 0
      let chunkMax = 0
      const end = Math.min(i + chunkSize, totalSamples)

      for (let j = i; j < end; j++) {
        const absValue = Math.abs(channelData[j])
        chunkSum += absValue
        chunkMax = Math.max(chunkMax, absValue)
      }

      const chunkAverage = chunkSum / (end - i)
      sum += chunkSum
      maxAmplitude = Math.max(maxAmplitude, chunkMax)

      if (chunkAverage < noiseThreshold) {
        silenceCount++
      } else if (chunkAverage > speechThreshold) {
        speechCount++
      }
    }

    const averageAmplitude = sum / totalSamples
    const silenceRatio = silenceCount / Math.ceil(totalSamples / chunkSize)
    const speechRatio = speechCount / Math.ceil(totalSamples / chunkSize)

    console.log("Audio Analysis:", {
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      averageAmplitude: averageAmplitude,
      maxAmplitude: maxAmplitude,
      silenceRatio: silenceRatio,
      speechRatio: speechRatio,
      totalSamples: totalSamples,
      noiseThreshold: noiseThreshold,
      speechThreshold: speechThreshold,
    })

    if (
      averageAmplitude < noiseThreshold ||
      maxAmplitude < speechThreshold ||
      silenceRatio > 0.8 ||
      speechRatio < 0.15 ||
      audioBuffer.duration < 1.0
    ) {
      console.log("Audio appears to be silence, background noise, or too short")
      feedback.innerHTML =
        '<p class="error">No clear speech detected in the recording. Please speak clearly into the microphone.</p>'
      return
    }

    currentAudioBlob = audioBlob
    const audioUrl = URL.createObjectURL(audioBlob)
    audioPlayer.src = audioUrl
    audioPlayerContainer.classList.remove("hidden")

    downloadBtn.onclick = () => {
      const a = document.createElement("a")
      a.href = audioUrl
      a.download = `speech-exercise-${currentExerciseIndex + 1}.webm`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }

    const reader = new FileReader()
    reader.readAsDataURL(audioBlob)

    reader.onloadend = async () => {
      const base64Audio = reader.result.split(",")[1]

      const requestBody = {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Please analyze this speech recording for signs of Parkinson's disease. The text that was read is: "${practiceText.textContent}"
              Focus on the following speech characteristics:
              1. Monotone or reduced vocal intensity
              2. Abnormal speech rate (too fast or too slow)
              3. Articulation issues (slurred or unclear speech)
              4. Tremor or instability in voice
              5. Pauses or difficulty initiating speech
              
              Provide feedback in this exact format:
              Brief Description: [A breif overall description of the audio]
              
              Risk Score: [0-100]%

              Notable Symptoms: [list symptoms detected]

              Suggested Next Steps: [recommendations]`
              },
              {
                inlineData: {
                  mimeType: "audio/webm",
                  data: base64Audio,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 256,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      }

      console.log("Sending audio data to AI...")
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()
      console.log("AI Response:", data)

      if (data.candidates && data.candidates[0].content.parts[0].text) {
        const feedbackText = data.candidates[0].content.parts[0].text

        const formattedFeedback = feedbackText
          .split("\n")
          .map((line) => {
            if (line.startsWith("Score:")) {
              return `<div class="feedback-score">${line}</div>`
            } else if (line.startsWith("Great job on:")) {
              return `<div class="feedback-strengths">${line}</div>`
            } else if (line.startsWith("Try to improve:")) {
              return `<div class="feedback-improvement">${line}</div>`
            }
            return line
          })
          .join("<br>")

        feedback.innerHTML = formattedFeedback

        const accuracyMatch = feedbackText.match(/Score:\s*(\d+)%/)
        accuracy = accuracyMatch ? Number.parseInt(accuracyMatch[1]) : 0

        if (!isRepeating) {
          if (exerciseScores[currentExerciseIndex] === null) {
            completedExercises++
          }
          exerciseScores[currentExerciseIndex] = accuracy
          updateProgressUI()
        } else {
          exerciseScores[currentExerciseIndex] = accuracy
        }

        updateAccuracyUI(accuracy)
        updateStatsUI()
        updateNavigationButtons()

        if (completedExercises === TOTAL_EXERCISES) {
          setTimeout(() => {
            showCompletionPage()
          }, 1000)
        }
      } else {
        console.error("Invalid AI response format:", data)
        feedback.innerHTML = '<p class="error">Error analyzing speech. Please try again.</p>'
      }
    }
  } catch (error) {
    console.error("Error analyzing speech:", error)
    feedback.innerHTML = '<p class="error">Error analyzing speech. Please try again.</p>'
  }
}

startBtn.addEventListener("click", startRecording)
stopBtn.addEventListener("click", stopRecording)
newTextBtn.addEventListener("click", () => {
  audioPlayer.src = ""
  audioPlayerContainer.classList.add("hidden")
  currentAudioBlob = null

  isRepeating = false
  repeatingStatus.classList.add("hidden")

  if (currentExerciseIndex < TOTAL_EXERCISES) {
    updatePracticeText()
    accuracyScore.classList.add("hidden")
    feedback.innerHTML = "<p>Your feedback will appear here after recording.</p>"
  } else {
    initializeProgress()
    updatePracticeText()
  }

  startBtn.disabled = false
  stopBtn.disabled = true
  repeatBtn.disabled = true
  newTextBtn.disabled = false
})

repeatBtn.addEventListener("click", () => {
  isRepeating = true
  repeatingStatus.classList.remove("hidden")

  audioPlayer.src = ""
  audioPlayerContainer.classList.add("hidden")
  currentAudioBlob = null

  feedback.innerHTML = "<p>Your feedback will appear here after recording.</p>"
  accuracyScore.classList.add("hidden")

  startBtn.disabled = false
  stopBtn.disabled = true
  repeatBtn.disabled = true
  newTextBtn.disabled = false
})

function showCompletionPage() {
  const mainContent = document.querySelector("main")
  mainContent.classList.add("hidden")
  completionPage.classList.remove("hidden")

  const validScores = exerciseScores.filter((score) => score !== null)
  const finalAvgAccuracy = validScores.reduce((sum, score) => sum + score, 0) / validScores.length
  const improvement = firstExerciseScore ? ((finalAvgAccuracy - firstExerciseScore) / firstExerciseScore) * 100 : 0

  document.getElementById("final-avg-accuracy").textContent = `${finalAvgAccuracy.toFixed(1)}%`
  document.getElementById("final-improvement").textContent = `${improvement.toFixed(1)}%`

  const scoresList = document.getElementById("exercise-scores-list")
  scoresList.innerHTML = ""
  exerciseScores.forEach((score, index) => {
    if (score !== null) {
      const scoreItem = document.createElement("div")
      scoreItem.className = "score-item"
      scoreItem.innerHTML = `
                <span>Exercise ${index + 1}</span>
                <span>${score.toFixed(1)}%</span>
            `
      scoresList.appendChild(scoreItem)
    }
  })
}

startNewSessionBtn.addEventListener("click", () => {
  currentExerciseIndex = 0
  exerciseScores = Array(TOTAL_EXERCISES).fill(null)
  completedExercises = 0
  firstExerciseScore = null

  document.querySelector("main").classList.remove("hidden")
  completionPage.classList.add("hidden")

  updateProgressUI()
  updateNavigationButtons()
  resetFeedbackUI()

  startBtn.disabled = false
  stopBtn.disabled = true
  repeatBtn.disabled = true
  newTextBtn.disabled = false

  recordingIndicator.classList.add("hidden")
  repeatingStatus.classList.add("hidden")
})

downloadSummaryBtn.addEventListener("click", () => {
  const summary = {
    date: new Date().toLocaleDateString(),
    finalAverageAccuracy: document.getElementById("final-avg-accuracy").textContent,
    overallImprovement: document.getElementById("final-improvement").textContent,
    exerciseScores: exerciseScores.map((score, index) => ({
      exercise: index + 1,
      score: score !== null ? `${score.toFixed(1)}%` : "Not completed",
    })),
  }

  const blob = new Blob([JSON.stringify(summary, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `speech-practice-summary-${new Date().toISOString().split("T")[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
})

// Initialize
initializeProgress()
setupSpeechRecognition()