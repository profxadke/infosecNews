# infosecNews

A simple REST API that compiles news from 28 different sources (as of now) and, returns or update news from specific sources from `/news` endpoint.

## How to Install / Use
1) First of all, get a vietual environment for this project.
```sh
$ virtualenv .venv  # if, uv installed: uv venv
```
2) Activate the virtual enviroment which you just created.
```sh
$ source .venv/bin/activate  # or, In Windows: .\.venv\Scripts\activate
```
3) Install all the dependencies, specified in `requirements.txt`
```sh
$ pip install -r requirements.txt  # or, with uv: uv pip install -r requirements.txt
```
4) After installation of dependencies, you can simply execute `main.py`
```sh
$ python ./main.py  # or ./main.py in Linux!
```

### And, Done! Now you should have a REST API service running on port `44444`
