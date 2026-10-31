"""Reading a remote's default branch, head commit and branches from one ls-remote."""

from __future__ import annotations

import unittest
from unittest import mock

from app.services import git_remote_access
from app.services.git_remote_url import parse_remote_url

OUTPUT = (
    "ref: refs/heads/main\tHEAD\n"
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\tHEAD\n"
    "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\trefs/heads/Zeta\n"
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\trefs/heads/main\n"
    "cccccccccccccccccccccccccccccccccccccccc\trefs/heads/alpha\n"
    "dddddddddddddddddddddddddddddddddddddddd\trefs/heads/feature/usb-c\n"
)


class ReadingARemotesRefs(unittest.TestCase):
    def test_head_commit_and_default_branch_are_read_from_the_symref_output(self) -> None:
        self.assertEqual(git_remote_access.default_branch_from_symref(OUTPUT), "main")
        self.assertEqual(git_remote_access.head_sha_from_symref(OUTPUT), "a" * 40)

    def test_branches_come_default_first_then_alphabetical_ignoring_case(self) -> None:
        self.assertEqual(
            git_remote_access.branches_from_ls_remote(OUTPUT, "main"),
            ["main", "alpha", "feature/usb-c", "Zeta"],
        )

    def test_tags_and_other_refs_are_not_branches(self) -> None:
        output = "aaaa\trefs/tags/v1\nbbbb\trefs/pull/3/head\ncccc\trefs/heads/dev\n"
        self.assertEqual(git_remote_access.branches_from_ls_remote(output, None), ["dev"])

    def test_an_empty_repository_has_no_default_branch_commit_or_branches(self) -> None:
        fake = mock.Mock()
        fake.ls_remote.return_value = ""
        with mock.patch.object(git_remote_access, "Git", return_value=fake):
            refs = git_remote_access.read_remote_refs(parse_remote_url("https://git.example.com/a/b.git"))
        self.assertEqual(refs, (None, None, []))

    def test_one_ls_remote_asks_for_head_and_every_branch(self) -> None:
        fake = mock.Mock()
        fake.ls_remote.return_value = OUTPUT
        with mock.patch.object(git_remote_access, "Git", return_value=fake):
            refs = git_remote_access.read_remote_refs(parse_remote_url("https://git.example.com/a/b.git"))
        fake.ls_remote.assert_called_once_with("--symref", "https://git.example.com/a/b.git", "HEAD", "refs/heads/*")
        self.assertEqual(refs, ("main", "a" * 40, ["main", "alpha", "feature/usb-c", "Zeta"]))


if __name__ == "__main__":
    unittest.main()
