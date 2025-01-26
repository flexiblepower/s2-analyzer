# S2-Analyzer Frontend

This project involves the development of a frontend to TNO’s S2-Analyzer.

## Table of Contents

- [Project Description](#project-description)
- [Running the Application](#running-the-application)
    - [Prerequisites](#prerequisites)
    - [Setting Up the Backend](#setting-up-the-backend)
    - [Setting Up the Frontend](#setting-up-the-frontend)
- [Frontend Features](#frontend-features)
    - [Real Time Message Rendering](#real-time-message-rendering)
    - [Filters](#filters)
    - [Change Alignment](#change-alignment)
    - [Search Message By ID](#search-message-by-id)
    - [Terminal View](#terminal-view)
    - [Message Pop-ups](#message-pop-ups)
    - [Customized Message Renderings](#customized-message-renderings) 
-  [Testing the Application](#testing-the-application)

## Project Description

S2-Analyzer is a program that verifies and logs messages exchanged between two devices (namely a Resource Manager and a Client Energy Manager) as defined by the S2 Standard and its FRBC (Fill Rate Based Control) Control Type. In this project, we developed Single RealtimeDataPage Application to visualize connection histories and adding additional features such as filtering capabilities.

## Running the Application

### Prerequisites

To run the backend, you need to have *Docker* (and *Python* environment if it is necessary).

To run the frontend, you need to have *Node.js* and *npm*.

### Setting up the Backend

To set up and run the S2 analyzer backend:

```bash
docker compose up --build
```

This will build the backend to container images locally and run them. The backend is available on port `8001`.

For more information to set up the backend, you can check the backend's README file.

### Setting up the Frontend

#### Running the Frontend with NPM

To install the dependencies for the frontend, you need to run the following commands:

```bash
cd ./frontend/
npm install 
```

This will navigate you to the *frontend* folder and install all dependencies that you need to run the frontend.

After that, you need to run the following command when you are in the *frontend* folder:

```bash
npm run dev
```

#### Running the Frontend with Docker
To run the Frontend alongside the Backend, simply execute the following command at the root of the directory:
```bash
docker compose up --build
```

## Frontend Features
Here is an exhaustive list of the application's features:

### ErrorSidebar Menu
By clicking the sidebar icon on the navigation bar (the three horizontal lines) a resizable container will appear on the left side of the screen.
Here, all the parsing errors will be listed alongside the number of the line where they occurred. This number corresponds to their line number as seen in the Terminal View.
To close this view, simply press the same button again.

### Real Time Message Rendering
By default, when run in Docker, the application will look for and display any messages logged by the S2 Analyzer Backend in real time.
To test this by yourself, execute the following command:
(If the image is not there, download it form [here](https://drive.google.com/file/d/1vxENn-jzT7USi3XGxal2P4I9opISuVA1/view) and paste it in the folder)

```bash
cd frontend/setup
docker image load -i .\rm.tar
```
Then, using the same terminal, run the application via Docker compose and view the Frontend page.
Then, open two new terminals at the directory root and run one of these commands to one of them and the other command on the other terminal:
```bash
docker run --network=host --env CEM_URL=ws://localhost:8001/backend/cem/cem1/rm/battery1/ws 92e32168172ce3ff3642e257a122ba50891555733053b3578f64f726ae12be36

docker run --network=host --env CEM_URL=ws://localhost:8001/backend/rm/battery1/cem/cem1/ws 92e32168172ce3ff3642e257a122ba50891555733053b3578f64f726ae12be36
```
Now, you should be able to some messages flooding in from the Frontend.

In case this gets overwhelming, you can click the "Pause Real-Time" button to temporally stop real-time rendering.
To resume, click the button again (it should go under the "Continue Real-Time" name now) and the next time a message is
received, the message list and the terminal view will update with everything you might have missed.

### Filters
The filters menu contains a variety of stackable filters that allow users to limit which messages are visible on the screen at a time. To close this menu, simply click away.

Notably, the user is able to filter messages based on their sender (either "CEM" or "RM") and based on whether they came from logs (essentially all parsed messages) or from backend warnings (right now this includes only "Connection Lost" messages).

Apart from that, the user is also able to filter messages based on their message type, as indicated by their respective extendable menu tabs.

By default, all messages are displayed unconditionally - which means that all filters are selected as active.

### Change Alignment
Select the position of the message list in order to customize your space accordingly (left, center (default), right).

### Search message by ID
Use the search bar located on the navigation bar in order to search for a specific message by its ID. If a matching message is found, the rendered message list will be limited to only that message. Otherwise, no visual changes will be made.

### Terminal View
At the bottom of the screen, the extendable Terminal View allows users to view the exact lines of text that are being fed to the Frontend's parser.
This view is updated in real time or loaded once in the case a file was selected.
The user is able to select, copy, etc. any line rendered here.

### Message Pop-ups
By clicking any message rendered in the message list, a pop-up will appear containing its exact (property, value) pairs as defined by the S2 FRBC Standard.  This pop-up always appears near the cursor at a fixed position and is draggable from its top half, while anything
written on it is selectable.

In the top left corner, there is a button shaped like a "J" which changes the view of the message to more closely resemble its JSON format.

Furthermore, all message pop-ups listen to the following keyboard shortcuts:

1) X : Auto-closes all active pop-ups.
2) C : Enables "dragging" mode that allows the user to drag the pop-up from any point, at the cost of text no longer being selectable. Simply press the C button again to alternate between modes.

### Customized Message Renderings
As of now, the following messages have been programmed to be rendered in a customized manner:
(Please load the ".txt" files within "frontend/setup" in order to view them in action).

#### ReceptionStatus
All ReceptionStatus messages have been integrated with their respective target message and are being rendered as an icon next to their name, which denotes their status as follows:

|   Image    |                       Meaning                        |
|:----------:|:----------------------------------------------------:|
| Green Tick | Valid message or no ReceptionStatus message received |
| Dot Spiral |                   Buffered message                   |
| Red Triangle |                   Invalid message                  |
| White Arrow |                   Revoked message                    |

Furthermore, every ReceptionStatus icon is clickable, which leads to the activation of their respective message pop-up, containing more details about the reception status of their target message.

#### FRBC.UsageForecast and PowerForecast
When not viewing these messages in their JSON format, an intractable graph is rendered underneath their properties which renders their "elements" field.
Hovering over any point, will show its exact (x,y) value, while clicking the abbreviated labels in the legend will toggle their graph lines on and off.

When viewing these message's JSON format, the exact values of their "elements" array is being printed instead of the graph.

#### FRBC.SystemDescription
Since the "storage" and "actuators" fields of these messages can be very large, each of their elements are rendered as clickable annotations.

This means that each object in these two array-fields, is marked by its index number and a "Click to expand" label as its value. Whenever the property header (in this outermost case, the index number) is clicked
twice, the exact (property, value) pairs of that object will be displayed in the same manner.

We suggest activating "dragging mode" in order to double-click on property headers without selecting the text and being able to drag and adjust the pop-up as it expands.

#### ConnectionLost
As mentioned earlier, the only backend warning that is being displayed alongside the logged messages, are connection loses.
These messages are rendered without a directed arrow and with a red font in order to stand out. However, when you click on them, their pop-up will list exactly which device disconnected under its "sender" field.

## Testing the Application
 
 You can test the application by using either provided tests in the **./frontend/tests** folders or SonarQube to see the code smells, etc.

 ### Testing via  *"JEST"*

 You can run tests for *parser.ts* and *socket.ts* bb running the following commands:
 ```bash
 cd .\frontend\  # Go to the frontend folder
 npm test # Run tests
```

You can see how many tests and test suites were passed.

### Testing via *"SonarQube*

To test and analyze our code by using SonarQube, firstly, you can follow steps in this [link](https://docs.sonarsource.com/sonarqube/latest/try-out-sonarqube/) to create a project. After you created your project and got your token, you need to change following parts in [sonar-project.properties](/sonar-project.properties) file.

- sonar.projectKey=* **YOUR PROJECT KEY**
- sonar.projectName=  **YOUR PROJECT NAME**\
- sonar.login = **YOUR PROJECT TOKEN**
- sonar.host.url=http://localhost:9000 (change this part if you are using different url for SonarQube)


After changing these values, you need to run the following commands to create *coverage* folder which help you to see the test coverage of the project in SonarQube.

 ```bash
 cd .\frontend\  # Go to the frontend folder
npm test -- --coverage # Run tests and create a coverage folder
```

Lastly, you need to run these command to see the analysis on your SonarQube:

 ```bash
 cd ..  # Go back to the main folder
 sonar-scanner # Start analyzing the project
```

Now, you can see the analysis on your SonarQube.