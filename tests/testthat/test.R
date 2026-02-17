
test_that("snap", {
  local_edition(3)
  expect_snapshot(mtcars)
})

test_that("add_one works", {
  expect_equal(add_one(1), 2)
  expect_equal(add_one(0), 1)
})

test_that("times2 works", {
  expect_equal(times2(10), 20L)
  expect_equal(times2(0), 0L)
})

test_that("plus works", {
  expect_equal(plus(1, 2), 3)
})
