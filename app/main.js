const readline = require('readline');
const Firmata = require("firmata");
const board = new Firmata(process.env.FIRMATA_DEVICE || "/dev/ttyS0");

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

// board.settings.skipCapabilities = true;
console.log("Checking Firmata version...")

board.on("queryfirmware", () => {
    // Encoded terminal text colors, i.e. green is \x1b[32m
    console.log('\x1b[32m%s\x1b[0m', board.firmware.name +"  ✔ firmware name");
    console.log('\x1b[32m%s\x1b[0m', board.firmware.version.major + "." + board.firmware.version.minor + "              ✔ firmata version")
});

board.on("ready", function() {
  const LED = 14;

  const DIGITAL_OUT = 2;
  let state = 0;
  let DIGITAL_PASS = false;

  const ANALOG_OUT = 4;
  const ANALOG_IN = 3; 
  let ANALOG_PASS = false;
  const analogs = [ANALOG_IN];
  let i = 0;

  const POWER_DELAY = 5;
  const POWER_SLEEP = 20;

  console.log('\x1b[32m%s\x1b[0m', "balenaFin        ✔ ready");
  console.log('\x1b[35m%s\x1b[0m', "Press the 's' key to enter sleep test. Warning this will power down your balenaFin and the ssh connection will terminate!");
  console.log('\x1b[34m%s\x1b[0m', "Press the 'c' key to terminate the test.");
  console.log("Starting DIGITAL I/O check...");

  this.pinMode(LED, board.MODES.OUTPUT);
  this.pinMode(DIGITAL_OUT, board.MODES.OUTPUT);
  this.digitalWrite(DIGITAL_OUT, 1);

  const states = {
    1 : 0
  };

  Object.keys(states).forEach(function(pin) {
    pin = +pin;
    this.pinMode(pin, board.MODES.INPUT);
    this.digitalRead(pin, function(value) {
      console.log("DIGITAL_IN | Pin %d | Value %d", pin, value);
      if(value == 1){DIGITAL_PASS = true;}
    });
  }, this);

  process.stdin.on('keypress', (str, key) => {
    if(key.sequence === '\u0073') {
      console.log('\x1b[31m%s\x1b[0m', "Entering Sleep Test...");
      console.log('\x1b[31m%s\x1b[0m', `Fin will power down in ${POWER_DELAY} seconds and remain powered down for ${POWER_SLEEP} seconds...`);
      this.sysexCommand(configSleep(POWER_DELAY,POWER_SLEEP));
    }
    if(key.sequence === '\u0063') {
      console.log('\x1b[31m%s\x1b[0m', "Terminating test and resetting Firmata");
      board.reset();
      process.exit();
    }
  });

  console.log("Starting ANALOG I/O check...");

  this.pinMode(ANALOG_OUT, board.MODES.PWM);

  analogs.forEach(function(pin) {
    pin = +pin;
    this.pinMode(ANALOG_IN, board.MODES.ANALOG);
    this.analogRead(ANALOG_IN, function(value) {
      if(value > 2000){
        ANALOG_PASS = true;
      };
      // loops through duty cycles of PWM
      i = 10 + i;
      console.log("ANALOG_IN  | Pin %d | Value %d", ANALOG_IN, value);
      this.analogWrite(ANALOG_OUT, i);
      if(i >= 100){ i = 0}
    });
  }, this);



  setInterval(() => {
    this.digitalWrite(LED, (state ^= 1));
    if(DIGITAL_PASS && ANALOG_PASS){
      console.log('\x1b[32m%s\x1b[0m', "All checks passed ✔");
      process.exit();
    }
  }, 500);
});

process.on('SIGINT', function() {
  console.log("Resetting Firmata...");
  board.reset();
  process.exit();
});

function configSleep(delay,sleep) {
  // we want to represent the input as a 8-bytes array
  var byteArray = [0, 0, 0, 0, 0, 0];

  // pad every 8th bit with 0 for conformance with Firmata protocol
  var sleep_string = sleep.toString(2);
  sleep_string = padData(sleep_string);
  var sleep_data = parseInt(sleep_string, 2);

  var delay_string = delay.toString(2);
  delay_string = padData(delay_string);
  var delay_data = parseInt(delay_string, 2);

  for ( var index = 0; index < byteArray.length; index ++ ) {
      var byte = sleep_data & 0xff;
      byteArray[index] = byte;
      sleep_data = (sleep_data - byte) / 256 ;
  }

  // insert balena command
  byteArray.splice(0, 0, 0x0B);
  // insert balena subcommand
  byteArray.splice(1, 0, 0x01);  
  byteArray.splice(2, 0, delay_data);  
  console.log(byteArray)
  return byteArray;
};

function padData(input_string) {
  for (var i = 1; i < 6; i++) {
    input_string = input_string.splice((i*-7)-((i*1)-1), 0, "0");
  };
  return input_string
}

String.prototype.splice = function(idx, rem, str) {
  return this.slice(0, idx) + str + this.slice(idx + Math.abs(rem));
};