
test_that("snap", {
  local_edition(3)
  expect_snapshot(mtcars)
})
