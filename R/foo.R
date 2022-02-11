add_one <- function(x) {
  curl::curl
  xml2::read_xml
  x + 1
}

times2 <- function(x) {
  .Call(test_fun, as.integer(x)[1]);
}
