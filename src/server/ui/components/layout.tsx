import React from "react";
import Style from "../pages/style";

const Layout = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <html>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {/* <link rel="icon" type="image/x-icon" href="/static/favicon.ico" /> */}
        <title>{title}</title>
        <Style />
      </head>
      <body>
        <h1>
          <a href="/" className="hidden-link">
            {process.env.BRAIN_NAME}
          </a>
        </h1>
        {children}
      </body>
    </html>
  );
};

export default Layout;
