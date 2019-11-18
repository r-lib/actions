FROM rhub/ubuntu-rchk

USER root
RUN apt-get install sudo -y

RUN echo "docker ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/user && \
    chmod 0440 /etc/sudoers.d/user

USER docker

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
