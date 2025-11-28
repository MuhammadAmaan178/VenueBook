import React from "react";
import styled from "styled-components";

const CardHome = ({ icon, title, description }) => {
  return (
    <StyledWrapper>
      <div className="card">
        <div className="icon">{icon}</div>
        <h3 className="title">{title}</h3>
        <p className="description">{description}</p>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .card {
    width: 300px;
    padding: 24px;
    height: 230px;
    border-radius: 30px;
    background: #e0e0e0;
    text-align: center;
    cursor: pointer;

    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 12px;

    box-shadow: 15px 15px 30px #bebebe, -15px -15px 30px #ffffff;

    transition: all 0.3s ease-in-out;
  }

  .card:hover {
    transform: translateY(-8px);
    box-shadow: 20px 20px 40px #bebebe, -20px -20px 40px #ffffff;
  }

  .icon {
    font-size: 3rem;
  }
  .title {
    font-size: 1.3rem;
    font-weight: bold;
  }
  .description {
    color: #555;
    font-size: 0.95rem;
  }
`;

export default CardHome;
