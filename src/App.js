import React, { useState, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';
import axios from 'axios';

const panes = ["I", "am", "an", "amazing", "frontend", "developer", "at", "night"];

function Arena({ setAudioUrl }) {
  const [position, setPosition] = useState({ x: 0, y: 50 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [isFalling, setIsFalling] = useState(false);
  const [audioTexts, setAudioTexts] = useState([]);


  const [{ x, y }, api] = useSpring(() => ({
    x: 0,
    y: 50,
    config: { tension: 180, friction: 12 },
  }));

  useEffect(() => {
    let interval;
    if (isFalling) {
      interval = setInterval(() => {
        // Apply gravity and friction
        setVelocity((v) => ({ x: v.x * 0.98, y: v.y + 0.7 }));
        const newPos = {
          x: position.x + velocity.x,
          y: position.y + velocity.y,
        };

        // Check for floor collision
        if (newPos.y >= 280) {
          setVelocity((v) => ({ x: v.x * 1.5, y: -v.y * 0.8 }));
          newPos.y = 280;
          checkPaneCollision(newPos.x);
        }

        // Check for wall collision
        if (newPos.x <= 0 || newPos.x >= 380) {
          setVelocity((v) => ({ x: -v.x, y: v.y }));
        }

        // Check for stopping condition
        // console.log("velocities: ", Math.abs(velocity.x), Math.abs(velocity.y), newPos.y);
        if (
          Math.abs(velocity.x) < 0.5 &&
          Math.abs(velocity.y) < 0.5 &&
          newPos.y > 260
        ) {
          console.log("movement ended");
          y.set(280)
          setIsFalling(false); // Stop when velocity is very low
          clearInterval(interval);
          fetchAudio(audioTexts)
        } else {
          setPosition(newPos);
        }

        api.start({ x: newPos.x, y: newPos.y });
      }, 30);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isFalling, position, velocity, api]);



  const startFall = () => {
    setPosition({ x: 0, y: 50 });
    setVelocity({ x: Math.random() * 2 + 1, y: 0 });
    setIsFalling(true);
  };

  const checkPaneCollision = (xPos) => {
    const paneIndex = Math.floor(xPos / 50);
    if (paneIndex >= 0 && paneIndex < panes.length) {
      magic(panes[paneIndex]);
    }
  };

  const magic = (text) => {
    console.log(`Magic function called with text: ${text}`);
    setAudioTexts((prev) => [...prev, text]);
  };

  const fetchAudio = async (texts) => {
    try {
      console.log("calling API")
      console.log("json: ", JSON.stringify({ texts: texts }))
      const response = await fetch('http://localhost:5000/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: texts }),
      });
      const audioBlob = await response.blob();

      // Create a URL for the Blob
      const audioUrl = URL.createObjectURL(audioBlob);
      console.log("audioUrl: ", audioUrl)
      setAudioUrl(audioUrl);

    } catch (error) {
      console.error('Error fetching audio:', error);
    }
  };


  return (
    <div style={{ position: 'relative', width: '400px', height: '300px', border: '1px solid black', backgroundColor:'white'}}>
      <animated.div
        style={{
          position: 'absolute',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: 'red',
          transform: `translate3d(${x.get()}px,${y.get()}px,0)`,
        }}
      />
      <button onClick={startFall} style={{ position: 'absolute', top: '320px' }}>Spawn Ball</button>
      <div style={{ position: 'absolute', top: '300px', width: '100%', display: 'flex', backgroundColor:'white'}}>
        {panes.map((pane, index) => (
          <div key={index} style={{ border: '1px solid gray', width:'50px', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis'}}>
            {pane}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [audioUrl, setAudioUrl] = useState(null);
  return (
    <div style={{flex:1, background:'#D2F5FA', height:'100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
      <h1>2D Arena</h1>
      <Arena setAudioUrl={setAudioUrl}/>
      <div style={{ marginTop: 50 }}>
      {audioUrl && (
          <><h2>Audio generated from panes</h2><audio controls src={audioUrl}>
            Your browser does not support the audio element.
          </audio></>
      )}
      </div>
    </div>
  );
}
