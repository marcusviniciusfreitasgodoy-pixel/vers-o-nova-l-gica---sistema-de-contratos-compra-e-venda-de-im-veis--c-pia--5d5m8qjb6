migrate(
  (app) => {
    app.runInTransaction((txApp) => {
      try {
        const reports = txApp.findRecordsByFilter('analysis_reports', "id != ''", '', 100000, 0)
        for (const record of reports) {
          txApp.delete(record)
        }
      } catch (e) {
        console.log('Error clearing analysis_reports:', e)
      }

      try {
        const contracts = txApp.findRecordsByFilter('contracts', "id != ''", '', 100000, 0)
        for (const record of contracts) {
          txApp.delete(record) // PocketBase automatically deletes associated files in storage
        }
      } catch (e) {
        console.log('Error clearing contracts:', e)
      }
    })
  },
  (app) => {
    // Data cleanup migration cannot be undone
  },
)
