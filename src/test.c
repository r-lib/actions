
#include <Rinternals.h>
#include <R_ext/Rdynload.h>

SEXP test_fun(SEXP arg) {
  return ScalarInteger(INTEGER(arg)[0] * 2);
}

static const R_CallMethodDef callMethods[]  = {
  { "test_fun",  (DL_FUNC) test_fun,  1 },
  { NULL, NULL, 0 }
};

void R_init_testpackage(DllInfo *dll) {
  R_registerRoutines(dll, NULL, callMethods, NULL, NULL);
  R_useDynamicSymbols(dll, FALSE);
  R_forceSymbols(dll, TRUE);
}
