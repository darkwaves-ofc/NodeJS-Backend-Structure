import os from "os";
import diskusage from "diskusage-ng";
import si from "systeminformation";

interface SystemUsage {
  cpuUsage: string;
  totalMemory: number;
  usedMemory: number;
  freeMemory: number;
}

interface DiskUsage {
  totalStorage: number;
  usedStorage: number;
  freeStorage: number;
}

interface SystemSpecs {
  id: number;
  type: string;
  usage: string | number; // Adjust according to actual types for 'usage'
  data: SystemData[];
}

interface SystemData {
  _id: number;
  title: string;
  amount: string | number; // Adjust according to actual types for 'amount'
}

function getPrimaryDiskPath(): string {
  if (os.platform() === "win32") {
    return "C:";
  } else {
    return "/";
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const formattedValue = (bytes / Math.pow(1024, i)).toFixed(2);

  return `${formattedValue} ${sizes[i]}`;
}

async function getCpuUsage(): Promise<si.Systeminformation.CurrentLoadData | null> {
  try {
    const sys = await si.currentLoad();
    return sys;
  } catch (error) {
    return null;
  }
}

async function getSystemUsage(): Promise<SystemUsage> {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const cpuUsage = await getCpuUsage();

  return {
    cpuUsage: cpuUsage ? cpuUsage.currentLoad.toFixed(2) + "%" : "0.00%",
    totalMemory: totalMemory,
    usedMemory: usedMemory,
    freeMemory: freeMemory,
  };
}

function getDiskUsage(path: string): Promise<DiskUsage> {
  return new Promise((resolve, reject) => {
    diskusage(path, (err, usage) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          totalStorage: usage.total,
          usedStorage: usage.used,
          freeStorage: usage.available,
        });
      }
    });
  });
}

async function updateSystemSpecs(): Promise<SystemSpecs[]> {
  try {
    const systemUsage = await getSystemUsage();
    const diskUsage = await getDiskUsage(getPrimaryDiskPath());

    return [
      {
        id: 1,
        type: "CPU",
        usage: systemUsage.cpuUsage,
        data: [
          { _id: 1, title: "No of cores", amount: os.cpus().length.toString() },
        ],
      },
      {
        id: 2,
        type: "Memory",
        usage: ((value: number, total: number) => {
          if (total === 0) return "0.00%";
          return `${((value / total) * 100).toFixed(2)}%`;
        })(systemUsage.usedMemory, systemUsage.totalMemory),
        data: [
          {
            _id: 1,
            title: "Total Memory",
            amount: formatBytes(systemUsage.totalMemory),
          },
          {
            _id: 2,
            title: "Used Memory",
            amount: formatBytes(systemUsage.usedMemory),
          },
          {
            _id: 3,
            title: "Free Memory",
            amount: formatBytes(systemUsage.freeMemory),
          },
        ],
      },
      {
        id: 3,
        type: "Storage",
        usage: ((value: number, total: number) => {
          if (total === 0) return "0.00%";
          return `${((value / total) * 100).toFixed(2)}%`;
        })(diskUsage.usedStorage, diskUsage.totalStorage),
        data: [
          {
            _id: 1,
            title: "Total Storage",
            amount: formatBytes(diskUsage.totalStorage),
          },
          {
            _id: 2,
            title: "Used Storage",
            amount: formatBytes(diskUsage.usedStorage),
          },
          {
            _id: 3,
            title: "Free Storage",
            amount: formatBytes(diskUsage.freeStorage),
          },
        ],
      },
    ];
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

export default updateSystemSpecs;
