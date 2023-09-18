
window.addEventListener('load', () => {
  const harness_ui = document.createElement('div');
  harness_ui.style.width = "100%";
  harness_ui.style.backgroundColor = "#EEE";
  harness_ui.style.padding = '5px';
  harness_ui.style.marginBottom = '5px';
  harness_ui.innerHTML = `
    <button id='harness-ui-connect'>Connect to device</button>
    <button id='harness-ui-run'>Run Test</button>
    <hr>
    <p>Aim the optical sensor at the square below.</p>
    <div>
      <div id="optical-target-area" style="width: 300px; height: 300px; border: solid black 1px; display: inline-block"></div>
      <div id="harness-ui-log" style="width: 500px; height: 290px; border: solid gray 1px; overflow-y:scroll; display: inline-block; padding:5px"></div>
    </div>
  `;
  document.body.insertBefore(harness_ui, document.body.firstChild);
  document.getElementById('harness-ui-connect').addEventListener('click', TestHarness.Connect);
  document.getElementById('harness-ui-run').addEventListener('click', TestHarness.Run);
  TestHarness.UpdateUI();
});

const TestHarness = new Object();

TestHarness.port = null;
TestHarness.reader = null;
TestHarness.running = false;
TestHarness.TestFunc = () => {};

TestHarness.UpdateUI = () => {
  document.getElementById('harness-ui-run').disabled = TestHarness.port == null;
}

TestHarness.Connect = () => {
  TestHarness.port = null;
  navigator.serial.requestPort({ filters: [{
      usbVendorId: 10374, // Seeed Studio
  }]}).then((port) => {
    TestHarness.port = port;
    TestHarness.UpdateUI();
  });
  TestHarness.UpdateUI();
}

TestHarness.Run = async () => {
  if (TestHarness.running) {
    return;
  }
  TestHarness.Log('Started running test.');
  TestHarness.running = true;
  await TestHarness.port.open({ baudRate: 9600 })
  TestHarness.Log('Measurement device serial port open.');
  TestHarness.LogSerialPortMessages();
  await TestHarness.TestFunc();
  // Wait for a second at end of test to allow messages from the 
  // measurement device to be flushed.
  await (() => {return new Promise(resolve => setTimeout(resolve, 1000));})();
  TestHarness.running = false;
  await TestHarness.reader.cancel();
  TestHarness.port.close().then(() => {
    TestHarness.Log('Measurement device serial port closed.');
    TestHarness.Log('Finished running test.');
  });          
}

TestHarness.Log = (message) => {
  document.getElementById('harness-ui-log').innerHTML += '<p>' + message + '</p>';
}

TestHarness.LogSerialPortMessages = async () => {
  if (!TestHarness.running) {
    return;
  }
  let message = "";
  const utf8Decoder = new TextDecoder("utf-8");
  TestHarness.reader = TestHarness.port.readable.getReader();
  try {
    while (true) {
      const { value, done } = await TestHarness.reader.read();
      if (done) {
        // |reader| has been canceled.
        break;
      }
      const chunk = value ? utf8Decoder.decode(value, { stream: true }) : "";
      console.log(chunk);
      message += chunk;
    }
  } catch (error) {
    TestHarness.Log( "Error: " + error );
  } finally {
    TestHarness.reader.releaseLock();
    TestHarness.reader = null;
  }

  if (message.length) {
    const re = /\r\n|\n|\r/gm;
    pos = 0;
    while (pos < message.length) {
      const line_break = re.exec(message);
      const next_break = line_break ? line_break.index : message.length;
      TestHarness.Log(`<b>Message from device: </b>${message.substring(pos, next_break)}`);
      pos = next_break;
      // message = message.substring(next_break);
    }
  }
}

TestHarness.UserInput = async (commands) => {
  const encoder = new TextEncoder();
  const writer = TestHarness.port.writable.getWriter();
  await writer.write(encoder.encode(commands));
  await writer.releaseLock();
}