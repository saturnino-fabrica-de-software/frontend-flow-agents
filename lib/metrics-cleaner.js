const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class MetricsCleaner {
  constructor() {
    this.metricsPath = path.join(process.cwd(), '.frontend-flow', 'metrics');
    this.maxAgeInDays = 30; // Keep metrics for 30 days
    this.maxSizeInMB = 100; // Max 100MB of metrics
  }

  async cleanOldMetrics() {
    try {
      const files = await fs.readdir(this.metricsPath);
      const now = Date.now();
      const maxAge = this.maxAgeInDays * 24 * 60 * 60 * 1000;

      let totalSize = 0;
      const fileStats = [];

      // Get all metrics files with stats
      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = path.join(this.metricsPath, file);
        const stats = await fs.stat(filePath);
        const age = now - stats.mtimeMs;

        fileStats.push({
          path: filePath,
          name: file,
          size: stats.size,
          age: age,
          date: stats.mtime
        });

        totalSize += stats.size;
      }

      // Sort by age (oldest first)
      fileStats.sort((a, b) => b.age - a.age);

      let deletedCount = 0;
      let freedSpace = 0;

      // Delete old files
      for (const file of fileStats) {
        if (file.age > maxAge) {
          await fs.remove(file.path);
          deletedCount++;
          freedSpace += file.size;
          console.log(chalk.gray(`  Removed old metrics: ${file.name}`));
        }
      }

      // Check total size and remove oldest if exceeding limit
      const maxSizeInBytes = this.maxSizeInMB * 1024 * 1024;
      let currentSize = totalSize - freedSpace;

      if (currentSize > maxSizeInBytes) {
        console.log(chalk.yellow(`⚠️ Metrics size exceeds ${this.maxSizeInMB}MB, cleaning...`));

        for (const file of fileStats) {
          if (currentSize <= maxSizeInBytes) break;
          if (file.age <= maxAge) { // Only if not already deleted
            await fs.remove(file.path);
            deletedCount++;
            freedSpace += file.size;
            currentSize -= file.size;
            console.log(chalk.gray(`  Removed to free space: ${file.name}`));
          }
        }
      }

      if (deletedCount > 0) {
        console.log(chalk.green(`✅ Cleaned ${deletedCount} old metric files (freed ${this.formatBytes(freedSpace)})`));
      }

      return {
        filesDeleted: deletedCount,
        spaceFreed: freedSpace,
        currentSize: currentSize
      };

    } catch (error) {
      console.error(chalk.red('Error cleaning metrics:'), error.message);
      return {
        filesDeleted: 0,
        spaceFreed: 0,
        currentSize: 0
      };
    }
  }

  async archiveMetrics() {
    try {
      const archivePath = path.join(this.metricsPath, 'archive');
      await fs.ensureDir(archivePath);

      const files = await fs.readdir(this.metricsPath);
      const now = new Date();
      const archiveName = `metrics-archive-${now.toISOString().split('T')[0]}.json`;
      const archiveFile = path.join(archivePath, archiveName);

      const aggregatedMetrics = {};

      // Aggregate all metrics
      for (const file of files) {
        if (!file.endsWith('.json') || file === 'current.json') continue;

        const filePath = path.join(this.metricsPath, file);
        try {
          const data = await fs.readJSON(filePath);
          Object.assign(aggregatedMetrics, data);
        } catch (e) {
          // Skip corrupted files
        }
      }

      // Save archive
      await fs.writeJSON(archiveFile, {
        timestamp: now.toISOString(),
        metrics: aggregatedMetrics
      }, { spaces: 2 });

      console.log(chalk.green(`📦 Metrics archived to: ${archiveName}`));

      return archiveFile;

    } catch (error) {
      console.error(chalk.red('Error archiving metrics:'), error.message);
      return null;
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  async scheduleCleanup() {
    // Run cleanup daily
    setInterval(async () => {
      console.log(chalk.blue('🧹 Running scheduled metrics cleanup...'));
      await this.cleanOldMetrics();
    }, 24 * 60 * 60 * 1000); // Every 24 hours

    // Run initial cleanup
    await this.cleanOldMetrics();
  }
}

module.exports = MetricsCleaner;