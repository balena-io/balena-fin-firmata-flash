FROM balenalib/raspberrypi3-node:build

# Defines our working directory in container
WORKDIR /usr/src/app

# install required packages
RUN apt-get update && apt-get install -yq --no-install-recommends \
    ftdi-eeprom \
    git \
    build-essential \
    libtool \
    pkg-config \
    autoconf \
    automake \
    texinfo \
    libusb-1.0 \
    libftdi-dev \
    screen \
    telnet \
    make \
    && git clone --depth 1 https://git.code.sf.net/p/openocd/code openocd-code && \
      cd openocd-code && git submodule init && git submodule update && chmod -R +x ./* && autoreconf -f -i && ./configure --enable-sysfsgpio && make && \
      make install

# Move app to filesystem
COPY ./app ./

# Make the openocd script executable
RUN chmod +x openocd.sh

# Install node libs
RUN npm install

# Start app
CMD ["bash", "/usr/src/app/start.sh"]
