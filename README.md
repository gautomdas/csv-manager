# CSV Data Management App

This is a purpose built app I made while working at [tradEAsy](https://web.tradeasy.tech/). This app was built with the intention of merging multiple customer data files from different data providers. However, this app can generally be used to merge multiple CSV files, edit the columns live, search through files, and generate reports.

This project uses a SERN stack: SQL, Express, React, and Node.

## Front End

The front end was written in React and uses TypeScript. To run the front-end for development use the following script (or any package manager you prefer):

```
npm i
npm run start
```

To build this project use:

```
npm run build
serve -s build
```

## Backend

The backend is a custom layer that acts a middle man CRUD app. It is built using Express.js to handle routing and Node.js for the server. This application interfaces with any mysql database running on port `3306`. The database must be created ahead of time. Tables can also be created ahead of time or created in the app later on.

To run the backend in development you can run:

```
npm i
npm run start:dev
```

To run the backend in production:

```
npm run start
```

To run the backend in a docker container:

```
docker build -t the-backend ./backend
docker run -p 8000:8000 --name backend the-backend
```
