import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.sungbinstudio.numberreadercalculator",
  appName: "Number Reader Calculator",
  webDir: "out",
  server: {
    androidScheme: "https"
  }
};

export default config;
