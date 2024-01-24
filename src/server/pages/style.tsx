import React from "react";

const Style = () => {
  return (
    <style>{`
        body {
          margin: 0;
          padding: 16px 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: Arial, sans-serif;
          background-color: #111; /* Dark gray background */
          color: #eee;
        }
        h1 {
          color: #eee; /* Near white text for the heading */
          margin-top: 16px;
          text-align: center; /* Center text */
        }
        h3 {
          margin: 4px 0px 8px 0px;
        }
        h6 {
          margin: 16px;
          text-align: center;
        }
        div {
          margin: 10px auto; /* Centering and spacing between elements */
        }
        img,
        video {
          width: 100%; /* Full width of the container */
        }

        .hidden-link {
          text-decoration: none;
          color: inherit;
        }
        
        a {
          user-select: text;
        }

        p {
            padding: 0px 0px 0px 0px;
            margin: 0px 0px 0px 0px;
            line-height: 1.35;
        }

        .content-container {
          display: flex;
          flex-direction: column; 
          gap: 16px; /* Spacing between columns */
          max-width: 640px;
        }
        
        .entry-container {
            display: flex;
            flex-direction: column;
            max-width: 768px;
            gap: 24px;
        }

        .memory-holder {
            display: flex;
            flex-direction: column;
            max-width: 600px;
            gap: 24px;
        }

        .similar {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: px;
        }

        @media (min-width: 1280px) {
          .content-container {
            flex-direction: row; /* Arrange children in a row */
            max-width: 1200px; /* Set a max width for the container if needed */
            gap: 64px; /* Spacing between columns */
          }
          .audio {
            width: 100%;
          }
        }

      
        .memory {
            display: flex;
            flex-direction: column; 
            gap: 8px;
        }
  
        .mono {
          font-family: monospace;
          font-size: 0.64rem;
          text-align: center;
          text-overflow: ellipsis;
        }

        .truncate {
          display: -webkit-box;
          -webkit-line-clamp: 3; /* Number of lines you want to display */
          -webkit-box-orient: vertical;  
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
  );
};

export default Style;
