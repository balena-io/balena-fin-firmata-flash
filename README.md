# balena-fin-firmata-flash

This is a balena application that allows to flash the balenaFin Coprocessor with the latest version of the [balenaFin Firmata](https://github.com/balena-io/balena-fin-coprocessor-firmata). For more information about Firmata, check out the official [repo](https://github.com/firmata/protocol). **This currently supports the balenaFin v1.0** (v1.1 will soon be supported as well).

### Getting started

1. Setup your balena account and push to your application following the [getting started](https://www.balena.io/docs/learn/getting-started/fincm3/python/#account-setup) guide, but don't flash the image you've downloaded to your balenaFin yet.
2. Set the following variable in the *fleet configuration* menu (leave the quotes as-is):
   - `RESIN_HOST_CONFIG_dtoverlay` = `"balena-fin","uart0,txd0_pin=32,rxd0_pin=33,pin_func=7"`
3. Set the following variable in the *environment variables* menu:
   - `FIRMATA_DEVICE` = `/dev/ttyAMA0`
4. Flash the image to your Fin
5. **(Only when using the development image)** If you're using the development version of balenaOS, you'll need to disable the serial console. Edit `cmdline.txt` on the `resin_boot` partition to remove this part of the line: `console=ttyAMA0,115200`. 
6. Remove your Fin from the USB connector and power it on.
7. Check the balenaCloud terminal for your application to see if your device has successfully connected and flashed the bootloader & firmata application for the Coprocessor.
8. **(Only when using the development image)** Stop getty from trying to start up a serial console. SSH in to the host OS of your balenaFin (you can do this through balenaCloud or the CLI). Run the following commands:
    ```
    mount -o remount,rw /
    systemctl mask serial-getty@serial0.service
    reboot
    ```
9.  You can now test the connection to the coprocessor as described below.

### Optional: Use miniUART

If you require using uart0 for some other purpose than the coprocessor, you can use the miniUART on the CM3 to connect to the coprocessor. As the miniUART is tied to the main CPU, this requires setting the Pi's ARM core to a fixed speed, so it will probably use more power. To do this, you can omit steps 5 and 8 from the list above, and use the following variables in steps 2 and 3:

In the *fleet configuration* menu (leave the quotes as-is):
   - `RESIN_HOST_CONFIG_dtoverlay` = `"balena-fin","uart1,txd1_pin=32,rxd1_pin=33"`
   - `RESIN_HOST_CONFIG_core_freq` = `250`

In the *environment variables* menu:
   - `FIRMATA_DEVICE` = `/dev/ttyS0`

This frees up `/dev/ttyAMA0` to use for another purpose.

### Checking Firmata is working correctly

To check if the Firmata is working correctly, run the following command inside your container:
```bash
node main.js
```
If it doesn't work, you may need to restart your device with the `STOP` environment variable set, because switching the coprocessor mux while running may cause some issues. Use the *environment variables* menu in balenaCloud to set it to anything other than an empty string. This will stop the container from flashing the coprocessor each time it starts.


The Firmata protocol should correctly output the messages `X ✔ firmware name` and `Y.Z ✔ firmata version` (where `Y` & `Z` are the current supported `MAJOR` & `MINOR` versions of firmata) when the balena application has been successfully started.

After starting, the balena application will perform a digital and analogue I/O test to validate that the pins are behaving correctly. **Please note, you should not have any devices connected to the USB hub during the test.**

In order to complete the tests connect jumper wires across the following pins:

|         |     Pin A      |       Pin B        |
|---------|----------------|--------------------|
| Digital |       2        |         1          |
| Analog  |       4        |         3          |
| LED*    | 14 -> (+) LED  |   (-) LED -> GND   |

![pins](img/exp_header.png)

**Note - you may wish to use a resistor in series with the LED to help protect it.*

These are indicated by the `EXP` header (#25) on the board shown below. Green:*digital*, blue:*analog* and orange:*LED*.

![fin](img/fin_v1_0.png)

If everything is running correctly, the console will print that the tests have started and if you connected an LED, it will start blinking. You might see pin values appear a couple of times as the tests complete as debounce can cause the pin values to fluctuate. Additionally the ANALOG_IN test will take a few seconds to complete as the ANALOG_OUT pin ramps its voltage up to max after each successful read.

```bash
Checking Firmata version...
StandardFirmata  ✔ firmware name
2.5              ✔ firmata version
balenaFin        ✔ ready
Starting DIGITAL I/O check...
Starting ANALOG I/O check...
DIGITAL_IN | Pin 4 : | Value 1
ANALOG_IN  | Pin 2 : | Value 2661
All checks passed ✔
```
Once all the checks have passed, the application will exit.

### Using Firmata

If everything was successful your balenaFin's Coprocessor is now running  Firmata! You can use this with a range of languages that support the Firmata protocol (Python, nodejs, etc.). Check the [balenaFin Firmata](https://github.com/balena-io/balena-fin-coprocessor-firmata) repository for more information about the currently supported features and additional commands.
