FROM node:4.3.1
ADD . /opt/api
WORKDIR /opt/api
CMD ["npm", "start"]
