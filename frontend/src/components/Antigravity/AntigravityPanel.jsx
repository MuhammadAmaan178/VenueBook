import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
  100% { transform: translateY(0px); }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(0, 255, 255, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(0, 255, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(0, 255, 255, 0); }
`;

const Container = styled.div`
  min-height: 100vh;
  background: #0a0a0a;
  color: #00ffff;
  font-family: 'Orbitron', sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at center, #1a1a1a 0%, #000000 100%);
    z-index: 0;
  }
`;

const Content = styled.div`
  z-index: 1;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 20px;
  padding: 40px;
  width: 80%;
  max-width: 800px;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.1);
  animation: ${float} 6s ease-in-out infinite;
`;

const Title = styled.h1`
  font-size: 3rem;
  text-align: center;
  margin-bottom: 30px;
  text-transform: uppercase;
  letter-spacing: 5px;
  text-shadow: 0 0 10px #00ffff;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 30px;
`;

const StatBox = styled.div`
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid #00ffff;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
  }
`;

const StatValue = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 10px;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  opacity: 0.8;
  text-transform: uppercase;
`;

const StatusMessage = styled.div`
  text-align: center;
  margin-top: 30px;
  font-size: 1.2rem;
  color: ${props => props.error ? '#ff0055' : '#00ffaa'};
  text-shadow: 0 0 5px currentColor;
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 3px solid rgba(0, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #00ffff;
  animation: spin 1s ease-in-out infinite;
  margin: 20px auto;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const AntigravityPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Assuming the backend is running on port 5000
        const response = await fetch('http://localhost:5000/api/antigravity/data');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Simulate "initiating sequence" delay for effect
    setTimeout(fetchData, 1500);
  }, []);

  return (
    <Container>
      <Content>
        <Title>Antigravity Control</Title>
        
        {loading && (
          <div>
            <StatusMessage>Initiating Antigravity Sequence...</StatusMessage>
            <LoadingSpinner />
          </div>
        )}

        {error && (
          <StatusMessage error>
            ⚠ SYSTEM FAILURE: {error}
            <br />
            <small>Gravity levels critical.</small>
          </StatusMessage>
        )}

        {data && (
          <>
            <StatusMessage>{data.message}</StatusMessage>
            <StatGrid>
              <StatBox>
                <StatValue>{data.nodes_active}</StatValue>
                <StatLabel>Active Nodes (Venues)</StatLabel>
              </StatBox>
              <StatBox>
                <StatValue>{data.data_streams}</StatValue>
                <StatLabel>Data Streams (Bookings)</StatLabel>
              </StatBox>
              <StatBox>
                <StatValue>{data.system_integrity}</StatValue>
                <StatLabel>System Integrity</StatLabel>
              </StatBox>
            </StatGrid>
          </>
        )}
      </Content>
    </Container>
  );
};

export default AntigravityPanel;
