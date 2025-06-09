# Project plan
## User flow
UI of the app will be 2 input fields: language of the sound and text output language. Under them there will be a big microphone icon.
The microphone is active only if the both languages are specified.
User presses the button and then microphone goes away and instead the ui is ready to output text. (like chatgpt ouput).
Audio input to the app processed, translated and returned to the screen.
Delay between audio input and output should be minimal.

## Technical details
Text and audio should be streamed to the client and out from the client.
The system prompt for ai should accept the languages specified and pass it to ai.
If the input is not in the language initially entered or already on the target language let AI to figure that out.

## Work plan
1. Login to open ai and specify spending limits. I don't want to loose money in case of mistake
2. Figure out backend <-> ai communication. Need to figure out streaming protocol. First version can stream ai output in the stdout. It can also accept audio as a file. After that figure out how to pass audio as a stream.
3. Figure out frontend <-> backend communication. Need to figure out the best protocol which can stream audio to the backend. It can be ugly but functional at this point.
4. Work on UI. Make it look nice.

## Next steps:
1. IGNORED Solve problem of loosing context each 10 seconds.
2. DONE Don't call translation if the wisperer returned nothing.
3. Move backend logic to next js
4. Remove backend folder
5. Figure out how to authenticate user for the app
6. Figure out how to work with secrets manager
7. Deploy my express app to aws lambda