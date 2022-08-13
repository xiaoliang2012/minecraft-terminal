# Minecraft Terminal

Minecraft Terminal is a lightweight CLI app that allows you to play minecraft in the terminal. 
### Note:
> This README is a work in progress:
>- [x] Downloads
>- [ ] Usage
>    - [x] Command-line usage
>    - [ ] Internal commands
>    - [ ] Remote control (RCON)
>    - [ ] Configuration
>        - [ ] Credentials
>        - [ ] Configuration
>        - [ ] Physics

## Downloads

### Clone git repo

```
git clone https://github.com/678435021/Minecraft-Terminal.git
cd Minecraft-Terminal
npm install
node .
```
### Install with npm

```
npm i https://github.com/678435021/Minecraft-Terminal.git
mc-term
```
## Usage

### Command-line usage

```
Usage: 
   --no-conf, -nc      Do not use the configuration file. 
   --no-cred, -ns      Do not use the credentials file. 
   --cred, -c          <Auth> <Username> <Password> <Version> <Server> 
                       Override credentials from CLI arguments. 
   --help, -h          Show this help message. 
   --version, -v       Show version information.
```
You can use '!' in --cred to leave it empty.

**Examples and further explanations:**
```
node . --c ! Player456 ! ! ! 
```
- ! will use the login options specified in cred.json if no options are set it will use defaults
- This will use the the default settings overriding the username
```
node .  --no-cred
```
- This will not use the credentials file cred.json
```
node . --no-conf
```
- This will not use the configuration file config.json
### Internal commands

For now you can get basic help by typing `.help` in chat.
