// tonconnect.js
export class TonConnectUI {
  constructor({ manifestUrl }) {
    this.manifestUrl = manifestUrl;
    this.walletInfo = null;
  }

  async connectWallet() {
    const url = `https://ton-connect.github.io/open-tc?manifestUrl=${encodeURIComponent(this.manifestUrl)}`;
    const popup = window.open(url, "_blank", "width=480,height=700");
    if (!popup) throw new Error("Не удалось открыть окно подключения");

    return new Promise((resolve) => {
      const listener = (event) => {
        if (event.origin !== "https://ton-connect.github.io") return;
        if (event.data && event.data.event === "connect") {
          this.walletInfo = event.data;
          window.removeEventListener("message", listener);
          popup.close();
          resolve(event.data);
        }
      };
      window.addEventListener("message", listener);
    });
  }

  async sendTransaction(tx) {
    if (!this.walletInfo) throw new Error("Кошелёк не подключён");

    const message = {
      method: "ton_sendTransaction",
      params: [tx],
    };

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = `https://ton-connect.github.io/open-tc?manifestUrl=${encodeURIComponent(this.manifestUrl)}`;

    document.body.appendChild(iframe);

    return new Promise((resolve) => {
      const listener = (event) => {
        if (event.origin !== "https://ton-connect.github.io") return;
        if (event.data && event.data.event === "txSent") {
          window.removeEventListener("message", listener);
          document.body.removeChild(iframe);
          resolve(event.data);
        }
      };
      window.addEventListener("message", listener);

      setTimeout(() => {
        iframe.contentWindow.postMessage(message, "https://ton-connect.github.io");
      }, 1000);
    });
  }
}
