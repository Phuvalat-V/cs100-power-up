# Final Demo evidence

Use non-sensitive test data. Record the commit SHA, tester, devices or browsers,
expected result, observed result, and evidence link for each case.

| Case | What to capture |
| --- | --- |
| Challenge and exchange | Player completes the activity. Host generates and copies Item JSON with a real evidence URL. A tester from another group pastes the JSON, chooses a portfolio, edits the reflection and saves. |
| Cross-device save | Open the public EC2 URL on a second device or browser and show the item and the updated reflection. |
| Persistence | Show the item before and after restarting the server and rebooting EC2. |
| Validation | Show rejected malformed JSON, invalid required fields or evidence, and a duplicate item ID. |
| Storage access | Show the server API returning records and a direct request to /portfolios.json returning 404. |
| Individual export | Open the exported my-portfolio.json and confirm it has one portfolio, the exchanged item, all four reflection fields and the evidence URL. |
| Peer feedback | Link the GitHub issue, fix commit and retest evidence. |

Put the repository URL, submission commit SHA, accessible demo video link, and
observed test results in the group PDF. For the demo video, show the activity,
then the Copy, Import, destination selection, reflection, Save and Refresh flow.
Submit the individual export, feedback and peer review as instructed.
