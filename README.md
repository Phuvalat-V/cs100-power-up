# CS100 POWER UP! — Final System

## Run locally

Use Node.js 22 or newer. From the repository root, run:

```sh
node server.js
```

Open http://127.0.0.1:3000. The server persists demo portfolios in
`portfolios.json` by default. Checkpoint samples can be loaded from the page.
For an existing Checkpoint browser, old records are still under the localStorage
key `cs100-portfolios` on its original origin. To migrate, use the demo profile
and item forms, or submit each valid portfolio object as JSON to
`POST /api/portfolios`. Use only non-sensitive demo data. Demo portfolios are
shared across browsers and the app has no account authentication.

## Run on AWS EC2

1. Clone the project and install Node.js 22 or newer on the instance.
2. From the repository root, run `HOST=0.0.0.0 PORT=3000 node server.js`.
   Keep the data directory on persistent storage. Set `PORTFOLIO_DATA_DIR` to
   an absolute writable path if the app checkout is replaced during deployment.
3. Allow inbound TCP 3000 for the intended demo audience, with SSH limited to
   the administrator's source IP. Open `http://PUBLIC_IP:3000/` from a second device.
4. To start the process on reboot, use a systemd service with the repository
   as `WorkingDirectory`, the full Node binary path in `ExecStart`, and
   `HOST`, `PORT`, and `PORTFOLIO_DATA_DIR` as environment variables.
   Run as a regular service user with write access to the data directory.
   Enable the service and verify it restarts with the same data directory.

## Festival flow

- Host: Give the participant 5–10 minutes for the booth activity and check
  the completion criteria. Enter the challenge name, the participant's result,
  skills, reflection, and a shareable evidence link. Generate and copy the Item JSON.
- Tester: Paste the item in **Import Item**, choose your portfolio, check the
  evidence link, edit all four reflection fields as needed, and save.
- Open **Saved Portfolios**, reload from the server, and export your own card
  as `my-portfolio.json`. Submit the file and the instructor's feedback form.
  Complete the peer review separately.

## Final verification

| Check | Expected result |
| --- | --- |
| Host → Copy JSON → paste into the other group's app | Item validates with Checkpoint fields and evidence |
| Import malformed JSON or wrong field types | An error appears and no item is written |
| Import the same ID twice into one portfolio | The server rejects the second save |
| Save from browser A, open browser B | Both show the saved reflection and evidence |
| Restart server, then reboot EC2 | The saved portfolio remains accessible |
| Request `/portfolios.json` directly | HTTP 404 |
| Export from one saved card | Download contains only that portfolio and its items |

Record the real cross-group and EC2 results for the group PDF. Include the
repository URL, submitted commit SHA, and the demo video link. After peer
testing, record at least one improvement in a GitHub issue and include a
commit and retest evidence after the fix.
