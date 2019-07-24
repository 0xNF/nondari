import os, sys

def fmtln(f):
    fmt = f'<link rel="preload" href="{f}"/>'
    return fmt

def getFiles():
    files = []
    p = os.path.join(sys.path[0], "src")
    for root, dirs, fs in os.walk(p):
        for file in fs:
            if '.svg' in file:
                r  = os.path.join(root.split('src')[1])
                files.append(os.path.join(r, file))
    return files

def writePreload(links):
    with open(os.path.join(sys.path[0], 'generated_preloaders.txt'), 'w') as f:
        for link in links:
            f.write(link+'\n')
    return

def main():
    fs = getFiles()
    links = [fmtln(x) for x in fs]
    for link in links:
        print(link)
    writePreload(links)


if __name__ == "__main__":
    sys.exit(main())