// Global variables to hold the chart instances
let soilMoistureChart = null;
let temperatureChart = null;
let humidityChart = null;
let moistureData = [];

// Fungsi untuk mengontrol relay (menyalakan atau mematikan)
function setAutoMode(isAuto) {
  const modeStatus = isAuto ? 1 : 0; // 1 untuk auto, 0 untuk manual
  fetch("http://192.168.100.57/piranti_uap/set_auto_mode.php?mode=" + modeStatus)
    .then((response) => response.text())
    .then((data) => {
      alert("Auto mode status updated: " + data);
      updateAutoModeStatus(isAuto); // Memperbarui status mode otomatis
    })
    .catch((error) => console.error("Error setting auto mode:", error));
}

// Fungsi untuk memperbarui status mode otomatis di halaman
function updateAutoModeStatus() {
  fetch("http://192.168.100.57/piranti_uap/auto_mode_status.php")
    .then((response) => response.text())
    .then((data) => {
      const autoModeStatusElement = document.getElementById("autoModeStatus");
      if (data == "1") {
        autoModeStatusElement.textContent = "Mode: Auto";
        autoModeStatusElement.className = "status on";
      } else {
        autoModeStatusElement.textContent = "Mode: Manual";
        autoModeStatusElement.className = "status off";
      }
    });
}

// Fungsi untuk mengontrol relay berdasarkan mode otomatis atau manual
function controlRelay(state) {
  // Periksa apakah mode otomatis aktif atau tidak
  fetch("http://192.168.100.57/piranti_uap/relay_status.php?id=2") // ID 2 untuk mode otomatis
    .then((response) => response.text())
    .then((mode) => {
      if (mode == "1") {
        const soilMoisture = parseInt(document.getElementById("soil_moisture").textContent);
        if (soilMoisture < 30) {
          fetch("http://192.168.100.57/piranti_uap/control_relay.php?status=1"); // ON
        } else {
          fetch("http://192.168.100.57/piranti_uap/control_relay.php?status=0"); // OFF
        }
      } else {
        // Jika mode manual, kontrol relay secara langsung
        fetch("http://192.168.100.57/piranti_uap/control_relay.php?status=" + state)
          .then((response) => response.text())
          .then((data) => {
            alert("Relay status updated: " + data);
            updateRelayStatus(); // Memperbarui status relay setelah mengubahnya
          });
      }
    })
    .catch((error) => console.error("Error checking auto mode:", error));
}

// Fungsi untuk memperbarui status relay dari server
function updateRelayStatus() {
  fetch("http://192.168.100.57/piranti_uap/relay_status.php")
    .then((response) => response.text())
    .then((data) => {
      const relayStatusElement = document.getElementById("relayStatus");
      if (data == "1") {
        relayStatusElement.textContent = "Pump is ON";
        relayStatusElement.className = "status on";
      } else {
        relayStatusElement.textContent = "Pump is OFF";
        relayStatusElement.className = "status off";
      }
    });
}

// Fungsi untuk memperbarui data sensor (kelembaban tanah, suhu, dan kelembaban udara)
function updateSensorData() {
  fetch("http://192.168.100.57/piranti_uap/latest_data.php")
    .then((response) => response.json())
    .then((data) => {
      // Perbarui data ke halaman HTML
      document.getElementById("soil_moisture").textContent = data.soil_moisture;
      document.getElementById("temperature").textContent = data.temperature;
      document.getElementById("humidity").textContent = data.humidity;

      // Perbarui grafik dengan data terbaru
      updateCharts(data.soil_moisture, data.temperature, data.humidity);

      // Perbarui grafik garis kelembaban tanah dengan data terbaru
      updateMoistureLineChart(data.soil_moisture);
    })
    .catch((error) => console.error("Error updating sensor data:", error));
}

// Fungsi untuk memperbarui grafik
function updateCharts(soilMoisture, temperature, humidity) {
  const validSoilMoisture = Math.max(0, Math.min(100, parseFloat(soilMoisture || 0)));
  const validTemperature = Math.max(-50, Math.min(50, parseFloat(temperature || 0)));
  const validHumidity = Math.max(0, Math.min(100, parseFloat(humidity || 0)));

  if (soilMoistureChart) {
    soilMoistureChart.data.datasets[0].data = [validSoilMoisture, 100 - validSoilMoisture];
    soilMoistureChart.update();
  }
  if (temperatureChart) {
    temperatureChart.data.datasets[0].data = [validTemperature, 50 - validTemperature];
    temperatureChart.update();
  }
  if (humidityChart) {
    humidityChart.data.datasets[0].data = [validHumidity, 100 - validHumidity];
    humidityChart.update();
  }
}

// Fungsi untuk membuat chart pertama kali
function createCharts() {
  // Plugin untuk menambahkan nilai di tengah chart
  Chart.register({
    id: "centerText",
    beforeDraw: (chart) => {
      const ctx = chart.ctx;
      const width = chart.width;
      const height = chart.height;

      const value = chart.data.datasets[0].data[0];
      ctx.save();
      ctx.font = "bold 16px Arial";
      ctx.fillStyle = "#333";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      if (chart.canvas.id === "temperatureChart") {
        ctx.fillText(value + "°C", width / 2, height / 2); // Teks dengan °C
      } else {
        ctx.fillText(value + "%", width / 2, height / 2); // Teks tanpa °C
      }

      ctx.restore();
    },
  });

  // Create charts
  const soilMoistureCtx = document.getElementById("soilMoistureChart").getContext("2d");
  soilMoistureChart = new Chart(soilMoistureCtx, {
    type: "doughnut",
    data: {
      labels: ["Soil Moisture", "None"],
      datasets: [{
        data: [30, 70], // Contoh nilai awal
        backgroundColor: ["#FF6347", "#E0E0E0"],
        borderColor: ["#FF6347", "#E0E0E0"],
        borderWidth: 0.5,
      }],
    },
    options: {
      responsive: true,
      cutout: "70%",
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
    },
  });

  const temperatureCtx = document.getElementById("temperatureChart").getContext("2d");
  temperatureChart = new Chart(temperatureCtx, {
    type: "doughnut",
    data: {
      labels: ["Temperature", "None"],
      datasets: [{
        data: [25, 25], // Contoh nilai awal
        backgroundColor: ["#4CAF50", "#E0E0E0"],
        borderColor: ["#4CAF50", "#E0E0E0"],
        borderWidth: 0.5,
      }],
    },
    options: {
      responsive: true,
      cutout: "70%",
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
    },
  });

  const humidityCtx = document.getElementById("humidityChart").getContext("2d");
  humidityChart = new Chart(humidityCtx, {
    type: "doughnut",
    data: {
      labels: ["Humidity", "None"],
      datasets: [{
        data: [50, 50], // Contoh nilai awal
        backgroundColor: ["#FF9800", "#E0E0E0"],
        borderColor: ["#FF9800", "#E0E0E0"],
        borderWidth: 0.5,
      }],
    },
    options: {
      responsive: true,
      cutout: "70%",
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
    },
  });
}

const ctxMoistureLineChart = document.getElementById('moistureLineChart').getContext('2d');
const moistureLineChart = new Chart(ctxMoistureLineChart, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'Soil Moisture (%)',
      data: moistureData,
      borderColor: '#4CAF50',
      fill: false,
      borderWidth: 2,
      pointRadius: 3,
      tension: 0.1
    }],
  },
  options: {
    responsive: true,
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        title: { display: true, text: 'Time (s)' }
      },
      y: {
        min: 0,
        max: 100,
        title: { display: true, text: 'Moisture (%)' }
      }
    },
  }
});

// Fungsi untuk memperbarui grafik garis kelembaban tanah
function updateMoistureLineChart(moisture) {
  const currentTime = moistureLineChart.data.labels.length + 1; // Incremental time (seconds)
  moistureLineChart.data.labels.push(currentTime); // Add time to x-axis
  moistureLineChart.data.datasets[0].data.push(moisture); // Add moisture value to y-axis

  if (moistureLineChart.data.labels.length > 50) { // Limit the number of data points
    moistureLineChart.data.labels.shift(); // Remove the first time value
    moistureLineChart.data.datasets[0].data.shift(); // Remove the first moisture data point
  }

  moistureLineChart.update(); // Update the chart to reflect the new data
}

// Start updating sensor data and the chart every 2 seconds
setInterval(updateSensorData, 2000);

// Initialize functions on window load
window.onload = function () {
  updateAutoModeStatus();
  updateRelayStatus();
  updateSensorData();
  createCharts();
};
