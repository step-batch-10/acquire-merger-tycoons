import { assertEquals } from "@std/assert";
import { describe, it } from "testing/bdd";
import { Sessions } from "../src/models/sessions.ts";

describe("Session model", () => {
  it("testing onePlayer", () => {
    const idGenerator = () => "1";
    const sessions = new Sessions(idGenerator);

    assertEquals(sessions.addPlayer("Sudheer"), "1");
    assertEquals(sessions.getPlayerName("1"), "Sudheer");
  });

  it("testing getPlayerName", () => {
    let id = 1;
    const idGenerator = () => `${id++}`;
    const sessions = new Sessions(idGenerator);

    sessions.addPlayer("Sudheer");
    sessions.addPlayer("Pradeep");

    assertEquals(sessions.addPlayer("Likhi"), "3");
    assertEquals(sessions.addPlayer("Pragna"), "4");

    assertEquals(sessions.getPlayerName("4"), "Pragna");
  });

  describe("testing removeSession", () => {
    it("should return waiting when only one player joined", () => {
      let id = 0;
      const idGenerator = () => `${id++}`;
      const sessions = new Sessions(idGenerator);

      sessions.addPlayer("Sudheer");

      assertEquals(sessions.removeSession("1"), "Removed Successfully");
      assertEquals(sessions.getPlayerName("1"), null);
    });
  });
});
