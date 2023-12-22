import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'phoenix';
import './App.css';

function App() {
  const [channelName, setChannelName] = useState('');
  const [payloadInput, setPayloadInput] = useState('');
  const [sendMessage, setSendMessage] = useState(''); // 用于存储要发送的数据
  const [messages, setMessages] = useState([]);
  const socket = useRef(null);
  const channel = useRef(null);

  useEffect(() => {
    socket.current = new Socket("ws://localhost:4000/socket");
    socket.current.connect();

    return () => {
      socket.current.disconnect();
    }
  }, []);

  const appendMessage = (msg) => {
    const timestamp = new Date().toLocaleTimeString();
    setMessages(prevMessages => [`${timestamp}: ${msg}`, ...prevMessages]);
  };

  const handleJoinChannel = () => {
    appendMessage("Joining channel: " + channelName);
    
    if (channel.current) {
      channel.current.leave();
    }

    const payloadArray = payloadInput.split(',').map(item => item.trim());
    channel.current = socket.current.channel(channelName, { ids: payloadArray });
    channel.current.join()
      .receive("ok", resp => {
        appendMessage("Joined successfully: " + JSON.stringify(resp));
      })
      .receive("error", resp => {
        appendMessage("Unable to join: " + JSON.stringify(resp));
      });

    channel.current.on("new_message", (resp) => {
      appendMessage("Received message: " + JSON.stringify(resp));
    });
  };

  const handleSendMessage = () => {
    if (channel.current) {
      channel.current.push("new_message", { body: sendMessage })
        .receive("ok", resp => {
          appendMessage("Message sent: " + JSON.stringify(resp));
        })
        .receive("error", resp => {
          appendMessage("Error sending message: " + JSON.stringify(resp));
        });
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <input 
          type="text"
          value={channelName}
          onChange={e => setChannelName(e.target.value)}
          placeholder="Enter channel name"
        />
        <input 
          type="text"
          value={payloadInput}
          onChange={e => setPayloadInput(e.target.value)}
          placeholder="Enter payload data (comma separated)"
        />
        <button onClick={handleJoinChannel}>Join Channel</button>
        <input 
          type="text"
          value={sendMessage}
          onChange={e => setSendMessage(e.target.value)}
          placeholder="Enter message to send"
        />
        <button onClick={handleSendMessage}>Send Message</button>
        <div className="log-container" style={{ overflowY: 'auto', height: '200px', border: '1px solid gray' }}>
          {messages.map((msg, index) => (
            <p key={index}>{msg}</p>
          ))}
        </div>
      </header>
    </div>
  );
}

export default App;
