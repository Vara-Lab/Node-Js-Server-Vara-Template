const express = require('express');
const { GearKeyring, GearApi, ProgramMetadata } = require('@gear-js/api');
const cors = require('cors');

const app = express();
const port = 3000;
const gasLimit = 9899819245;

// Alice's mnemonic for creating a keyring
const mnemonicAlice = 'slim potato consider exchange shiver bitter drop carpet helmet unfair cotton eagle';
const Alicekeyring = GearKeyring.fromMnemonic(mnemonicAlice, 'Alice');

// Program ID and metadata
const programID = "0xd5d1eb08af166ac3bb210bac52814324a0e33501edb8c57e9102e81c820c09a2";
const metadata = "00020000000100000000010100000000000000000102000000750424000808696f48547261666669634c69676874416374696f6e00010c14477265656e0000001859656c6c6f770001000c52656400020000040808696f44547261666669634c696768744576656e7400010c14477265656e0000001859656c6c6f770001000c52656400020000080808696f4c496f547261666669634c696768745374617465000008013463757272656e745f6c696768740c0118537472696e67000124616c6c5f75736572731001585665633c284163746f7249642c20537472696e67293e00000c00000502001000000214001400000408180c001810106773746418636f6d6d6f6e287072696d6974697665731c4163746f724964000004001c01205b75383b2033325d00001c000003200000002000200000050300";

// Enable CORS and JSON parsing for incoming requests
app.use(cors());
app.use(express.json());

/**
 * Function to initialize the Gear API
 */
async function initializeGearApi() {
  try {
    const gearApi = await GearApi.create({
      providerAddress: 'wss://testnet.vara.network',
    });
    console.log("Gear API initialized");
    return gearApi;
  } catch (error) {
    console.error("Failed to initialize Gear API:", error);
    throw error;
  }
}

/**
 * GET endpoint to read the program state
 */
app.get('/program-state', async (req, res) => {
  const gearApi = await initializeGearApi();
  const meta = ProgramMetadata.from(metadata);

  try {
    const state = await gearApi.programState.read(
      {
        programId: programID,
      },
      meta
    );

    res.status(200).send({
      message: 'Program state retrieved successfully',
      data: state.toHuman(),
    });
  } catch (error) {
    console.error(`${error.name}: ${error.message}`);
    res.status(500).send({
      message: 'Error retrieving program state',
    });
  }
});

/**
 * POST endpoint to send a message to the program
 */
app.post('/send-message/:payload', async (req, res) => {
  const gearApi = await initializeGearApi();
  const meta = ProgramMetadata.from(metadata);
  
  // Extract payload from the route parameter
  const { payload } = req.params;
  if (!payload) {
    return res.status(400).send({ message: 'Payload is required' });
  }

  try {
    const message = {
      destination: programID,
      payload,
      gasLimit,
      value: 0,
    };
    const extrinsic = gearApi.message.create(message, meta);
    await extrinsic.signAndSend(Alicekeyring);
    res.status(200).send({
      message: 'Message sent successfully',
    });
  } catch (error) {
    console.error(`${error.name}: ${error.message}`);
    res.status(500).send({
      message: 'Error sending message',
    });
  }
});

/**
 * Simple GET endpoint to verify server is running
 */
app.get('/', (req, res) => {
    res.send('Server is running');
  });

// Start the server on the specified port
app.listen(port, () => {
  console.log(`Server active at http://localhost:${port}`);
});
