AlphaDog v1.5.10.10 - Cron Deploy Target Proof Gate

Deploy this exact folder/ZIP to Cloudflare Worker prop-ingestion-git using wrangler.jsonc.
After deploy, the Killer Cleaner and Schedule Selected Only responses must both report v1.5.10.10.
The next incremental_daily data_refresh_queue output_json must also report v1.5.10.10.
If manual buttons report v1.5.10.10 but cron queue output reports v1.5.10.8 or v1.5.10.10, the cron is attached to an older/wrong Worker deployment target.
