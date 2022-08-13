# Minecraft Terminal

Minecraft Terminal is a lightweight CLI app that allows you to play minecraft in the terminal. 
### Note:
> This README is a work in progress:
>- [X] Downloads
>- [ ] Usage
>    - [X] Command-line usage
>    - [ ] Internal commands
>    - [ ] Hotkeys
>    - [ ] Remote control (RCON)
>    - [ ] Configuration
>        - [ ] Credentials
>        - [ ] Configuration
>        - [ ] Physics

## Downloads

### Clone git repo

```
$ git clone https://github.com/678435021/Minecraft-Terminal.git
$ cd Minecraft-Terminal
$ npm install
$ node .
```
### ~~Install with npm~~

```
$ npm i https://github.com/678435021/Minecraft-Terminal.git
$ mc-term
```
## Usage

### Command-line usage

```
Usage: 
   --no-conf, -nc           Do not use the configuration file. 
   --no-cred, -ns           Do not use the credentials file.
   --set-conf-path, -scp    Set the config folder path
   --get-conf-path, -gcp    Get the config folder path
   --gen-conf, -gc         Generate configuration files
   --cred, -c               <Auth> <Username> <Password> <Version> <Server> 
                            Override credentials from CLI arguments. 
   --help, -h               Show this help message. 
   --version, -v            Show version information.
```
You can use '!' in --cred to leave it empty.

**Examples and further explanations:**
```
$ node . --c ! Player456 ! ! ! 
```
- ! will use the login options specified in cred.json if no options are set it will use defaults
- This will use the the default settings overriding the username
```
$ node .  --no-cred
```
- This will not use the credentials file cred.json
```
$ node . --no-conf
```
- This will not use the configuration file config.json
```
$ node . --set-conf-path /home/.config/mc-term
```
- This will set the configuration files location and exit
```
$ node . --get-conf-path
```
> [INFO] Configuration files are located in: /home/.config/mc-term
- This will show the configuration files location and exit
```
$ node . --gen-conf
```
- This will generate default configuration files at the specified configuration folder
### Internal commands

For now you can get basic help by typing `.help` in chat.
