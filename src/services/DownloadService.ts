async function DownloadMainJson(): Promise<any> {
    return (await (await fetch('/json/drinks.json')).json());
}

export { DownloadMainJson };