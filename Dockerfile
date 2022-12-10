FROM loadimpact/k6:0.26.1
ENV SCRIPT /src/simulations/Script2.test.js 
ENV K6_OUT=influxdb=http://13.233.161.150:8086/k6
COPY ./src /src
WORKDIR /src
# Override the entry point of the base k6 image
ENTRYPOINT []
CMD ["sh", "-c", "k6 run $SCRIPT"]