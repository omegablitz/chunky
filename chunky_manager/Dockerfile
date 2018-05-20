FROM golang:1.8

WORKDIR /go/src/app
COPY go/src/github.com/omegablitz/chunky_manager .

COPY public public

RUN go get -d -v ./...
RUN go install -v ./...

CMD ["app"]

EXPOSE 4440
EXPOSE 4441
EXPOSE 8080
EXPOSE 80
