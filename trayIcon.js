const { app, Tray, Menu, MenuItem } = require("electron");
const YamahaAPI = require("yamaha-nodejs");
const path = require('path');

const staticDir = path.join(path.dirname(__dirname), 'static');

const trayIcon = () => {
  let destroyed = false;
  /** @type {Tray} */
  let tray;
  getController().then(async ({yamaha}) => {
    const initialOn = yamaha && await yamaha.isOn();
    const initialMuted = yamaha && await yamaha.isMuted();
    if (destroyed) {
      return;
    }
    const radioSmall = path.join(staticDir, 'radio-small.png');
    const radioOff = path.join(staticDir, 'radio-off.png');
    tray = new Tray(yamaha ? radioSmall : radioOff);
    const menuButtons = {
      powerToggle: new MenuItem({
        id: 'powerToggle',
        label: "On",
        type: "checkbox",
        enabled: Boolean(yamaha),
        checked: initialOn,
        click: async function () {
          if (!yamaha) {
            return;
          }
          this.enabled = false;
          if (!this.checked) {
            await yamaha.powerOn();
            menuButtons.muteToggle.enabled = true;
            menuButtons.checked = await yamaha.isMuted();
          } else {
            await yamaha.powerOff();
            menuButtons.muteToggle.enabled = false;
          }
          this.enabled = true;
          this.checked = !this.checked;
          tray.setContextMenu(contextMenu);
        },
      }),
      muteToggle: new MenuItem({
        id: 'muteToggle',
        label: "Mute",
        type: "checkbox",
        enabled: Boolean(yamaha) && initialOn,
        checked: initialMuted,
        click: async function () {
          if (!yamaha) {
            return;
          }
          this.enabled = false;
          this.checked = await yamaha.isMuted();
          if (!this.checked) {
            await yamaha.muteOn();
          } else {
            await yamaha.muteOff();
          }
          this.enabled = true;
          this.checked = !this.checked;
          tray.setContextMenu(contextMenu);
        },
      }),
      quite: new MenuItem({
        id: 'quite',
        label: "Quit",
        type: "normal",
        click: () => {
          app.exit(0);
        },
      })
    }

    const contextMenu = Menu.buildFromTemplate(Object.values(menuButtons));
    tray.setContextMenu(contextMenu);
  });
  // Cleanup function
  return () => {
    destroyed = true;
    if (tray) {
      tray.destroy();
    }
  };
};

let currentProcess = Promise.resolve();
const getController = () => {
  currentProcess = (async () => {
    await currentProcess.catch(() => {});
    console.log("Discover Yamaha");
    try {
      const yamaha = new YamahaAPI();
      await yamaha.getBasicInfo();
      const ip = await yamaha.discoverPromise.then(
        (r) => r,
        (r) => r
      );
      console.log("Found Yamaha", ip);
      return {
        ip,
        yamaha,
      };
    } catch (e) {
      console.log("Yamaha Error", e);
      return {};
    }
  })();
  return currentProcess;
};

module.exports = { trayIcon };
