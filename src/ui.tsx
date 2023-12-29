import * as fal from "@fal-ai/serverless-client";
import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import * as ReactDOM from "react-dom/client";
import "./ui.css";

const fal_key_id = "a908fb2e-f602-42bd-b599-1367874f8bf4"
const fal_key_secret = "a908fb2e-f602-42bd-b599-1367874f8bf4:9279c0eb5ccdd5056f1466d3195d6f95"

fal.config({
  credentials: `${fal_key_id}:${fal_key_secret}`,
});

const initalState = {};

function randomSeed(): number {
  const multipliers = [2342534, 1235392, 875441, 102321];
  const multiplier =
    multipliers[Math.floor(Math.random() * multipliers.length)];
  return Math.floor(Math.random() * multiplier);
}

function App() {
  const [image, setImage] = useState<null>(null);

  const [prompt, setPrompt] = useState<string>("");
  const [inferenceTime, setInferenceTime] = useState<number>(NaN);
  const [strength, setStrength] = useState<number>(0.8);
  const [seed, setSeed] = useState<string>(randomSeed().toFixed(0));
  const [imageData, setImageData] = useState<string | null>(null);

  window.addEventListener("message", (event) => {
    const { type, drawing, prompt } = event.data.pluginMessage;

    if (type === "drawingUpdated") {
      setPrompt(prompt);
      setImageData(drawing);
      updateImage();
    }
  });

  const { send } = fal.realtime.connect("110602490-lcm-sd15-i2i", {
    // The `connectionKey` is used to keep the same connection between component re-renders
    // It is useful to not require custom useRef/useEffect connection management
    connectionKey: "figma-live-draw",
    throttleInterval: 64,
    onResult(data) {
      try {
        if (data.images && data.images.length > 0 && data.images[0].url) {
          let imageURL = data.images[0].url;
          setImage(imageURL);
          setInferenceTime(data.timings?.inference || NaN);

          parent.postMessage(
            {
              pluginMessage: {
                type: "renderImage",
                image: imageURL,
              },
            },
            "*"
          );
        }
      } catch (e) {
        console.error("Error parsing the realtime response:", e);
      }
    },
    onError(error) {
      console.error("Error from the realtime connection:", error);
    },
  });

  const updateImage = useCallback(() => {
    if (!prompt || !imageData) {
      return;
    }
    const req = {
      prompt,
      seed: Number(seed) || randomSeed(),
      image_url: imageData,
      sync_mode: true,
      strength,
    };

    send(req);
  }, [prompt, imageData, seed, strength]);

  useEffect(() => {
    updateImage();
  }, [updateImage]);

  return <></>;
}

ReactDOM.createRoot(document.getElementById("react-page")).render(<App />);
