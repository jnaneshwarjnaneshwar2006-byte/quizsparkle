const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = Number(process.env.PORT || 5000);
const dbConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
};
const databaseName = process.env.DB_NAME || 'quizspark';
const pool = mysql.createPool({ ...dbConfig, database: databaseName });
const bootstrapPool = mysql.createPool({ ...dbConfig, connectionLimit: 1 });

const TEACHER_ID = '00000000-0000-4000-8000-000000000001';
const TEACHER_EMAIL = 'aditya2003@gmail.com';
const TEACHER_PASSWORD = '123456';

const allowedOrigins = new Set(
  String(process.env.FRONTEND_URL || '')
    .split(',')
    .map(origin => origin.trim().replace(/\/$/, ''))
    .filter(Boolean)
);

app.use(cors({
  credentials: false,
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin.replace(/\/$/, ''))) return callback(null, true);
    return callback(new Error('Origin is not allowed by QuizSpark API CORS policy'));
  }
}));
app.use(express.json({ limit: '5mb' }));

const uuid = () => crypto.randomUUID();
const validUuid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));

async function ensureDatabase() {
  await bootstrapPool.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``);
  await bootstrapPool.end();
  // The database is normally already created by database_schema.sql. The ALTER below
  // makes old installations compatible with the current frontend (avatar in lobby).
  try {
    await pool.query(`ALTER TABLE live_participants ADD COLUMN avatar VARCHAR(20) NULL AFTER student_name`);
  } catch (error) {
    if (error.code !== 'ER_DUP_FIELDNAME') throw error;
  }
  await pool.query(
    `DELETE duplicate_row FROM live_participants duplicate_row
     INNER JOIN live_participants kept_row
       ON kept_row.session_id = duplicate_row.session_id
      AND kept_row.student_id IS NULL
      AND duplicate_row.student_id IS NULL
      AND kept_row.student_name = duplicate_row.student_name
      AND COALESCE(kept_row.avatar, '') = COALESCE(duplicate_row.avatar, '')
      AND kept_row.joined_at <= duplicate_row.joined_at
      AND kept_row.id < duplicate_row.id`
  );
  const [legacyParticipants] = await pool.query(
    'SELECT id, student_name FROM live_participants WHERE student_id IS NULL'
  );
  for (const participant of legacyParticipants) {
    const studentId = uuid();
    const studentName = String(participant.student_name || 'Player').trim() || 'Player';
    await pool.query(
      `INSERT INTO users (id, email, password_hash, full_name, role)
       VALUES (?, ?, '', ?, 'student') ON DUPLICATE KEY UPDATE full_name=VALUES(full_name)`,
      [studentId, `legacy-${studentId}@quizspark.local`, studentName]
    );
    await pool.query('UPDATE live_participants SET student_id=? WHERE id=?', [studentId, participant.id]);
  }
  try {
    await pool.query('ALTER TABLE live_participants DROP FOREIGN KEY live_participants_ibfk_2');
  } catch (error) {
    if (error.code !== 'ER_CANT_DROP_FIELD_OR_KEY') throw error;
  }
  await pool.query('ALTER TABLE live_participants MODIFY COLUMN student_id CHAR(36) NOT NULL');
  try {
    await pool.query(
      `ALTER TABLE live_participants ADD CONSTRAINT live_participants_ibfk_2
       FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE RESTRICT`
    );
  } catch (error) {
    if (error.code !== 'ER_DUP_KEYNAME') throw error;
  }
  await pool.query(
    `INSERT INTO users (id, email, password_hash, full_name, role)
     VALUES (?, ?, ?, ?, 'teacher')
     ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), role = 'teacher'`,
    [TEACHER_ID, TEACHER_EMAIL, TEACHER_PASSWORD, 'QuizSpark Teacher']
  );
}

function mapSession(row) {
  if (!row) return null;
  return {
    id: row.id,
    quiz_id: row.quiz_id,
    host_id: row.teacher_id,
    status: row.status === 'started' ? 'live' : row.status === 'ended' ? 'finished' : 'waiting',
    created_at: row.created_at,
    started_at: row.started_at,
    ended_at: row.ended_at,
    current_question: row.current_question,
    session_code: row.session_code
  };
}

async function loadQuiz(id) {
  const [quizRows] = await pool.query('SELECT * FROM quizzes WHERE id = ? LIMIT 1', [id]);
  if (!quizRows.length) return null;
  const quiz = quizRows[0];
  const [questions] = await pool.query('SELECT * FROM questions WHERE quiz_id = ? ORDER BY order_index ASC, created_at ASC', [id]);
  for (const question of questions) {
    const [options] = await pool.query('SELECT * FROM options WHERE question_id = ? ORDER BY order_index ASC', [question.id]);
    question.options = options.map(o => ({ ...o, is_correct: Boolean(o.is_correct) }));
  }
  return { ...quiz, questions };
}

async function loadAllQuizzes() {
  const [rows] = await pool.query('SELECT * FROM quizzes ORDER BY created_at DESC');
  const result = [];
  for (const row of rows) result.push(await loadQuiz(row.id));
  return result;
}

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, database: process.env.DB_NAME || 'quizspark' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password, role, name } = req.body || {};
  if (String(email || '').trim().toLowerCase() !== TEACHER_EMAIL || password !== TEACHER_PASSWORD || role !== 'teacher') {
    return res.status(401).json({ error: 'Invalid teacher email or password.' });
  }
  await pool.query(
    `INSERT INTO users (id, email, password_hash, full_name, role)
     VALUES (?, ?, ?, ?, 'teacher')
     ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)`,
    [TEACHER_ID, TEACHER_EMAIL, TEACHER_PASSWORD, String(name || 'QuizSpark Teacher').trim()]
  );
  res.json({ user: { id: TEACHER_ID, role: 'teacher', name: String(name || 'QuizSpark Teacher').trim() || 'QuizSpark Teacher', avatar: '👑' } });
});

app.get('/api/quizzes', async (req, res) => {
  try { res.json(await loadAllQuizzes()); }
  catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

app.get('/api/quizzes/code/:code', async (req, res) => {
  try {
    const normalized = String(req.params.code).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const [rows] = await pool.query(
      `SELECT id FROM quizzes WHERE REPLACE(UPPER(code), '-', '') = ? AND status = 'published' LIMIT 1`,
      [normalized]
    );
    if (!rows.length) return res.status(404).json({ error: 'Quiz not found' });
    res.json(await loadQuiz(rows[0].id));
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

app.post('/api/quizzes', async (req, res) => {
  const quiz = req.body || {};
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const id = validUuid(quiz.id) ? quiz.id : uuid();
    const code = String(quiz.code || '').trim().toUpperCase() || `${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;
    const createdBy = validUuid(quiz.created_by) ? quiz.created_by : TEACHER_ID;

    await connection.query(
      `INSERT INTO users (id, email, password_hash, full_name, role)
       VALUES (?, ?, ?, ?, 'teacher') ON DUPLICATE KEY UPDATE id=id`,
      [TEACHER_ID, TEACHER_EMAIL, TEACHER_PASSWORD, 'QuizSpark Teacher']
    );

    await connection.query(
      `INSERT INTO quizzes (id, title, description, code, status, cover_image, default_timer, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title=VALUES(title), description=VALUES(description), code=VALUES(code),
       status=VALUES(status), cover_image=VALUES(cover_image), default_timer=VALUES(default_timer), updated_at=CURRENT_TIMESTAMP`,
      [id, String(quiz.title || ''), quiz.description || null, code, quiz.status === 'published' ? 'published' : 'draft', quiz.cover_image || null, Number(quiz.default_timer || 20), createdBy]
    );

    await connection.query('DELETE FROM questions WHERE quiz_id = ?', [id]);
    const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qid = validUuid(q.id) ? q.id : uuid();
      await connection.query(
        `INSERT INTO questions (id, quiz_id, question_text, question_type, media_url, media_type, timer_seconds, explanation, order_index)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [qid, id, q.question_text || '', q.question_type || 'multiple_choice', q.media_url || null, q.media_type || 'none', Number(q.timer_seconds || 20), q.explanation || null, i]
      );
      const options = Array.isArray(q.options) ? q.options : [];
      for (let j = 0; j < options.length; j++) {
        const o = options[j];
        await connection.query(
          `INSERT INTO options (id, question_id, option_text, option_color, is_correct, order_index)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [validUuid(o.id) ? o.id : uuid(), qid, o.option_text || '', o.option_color || 'red', o.is_correct ? 1 : 0, j]
        );
      }
    }
    await connection.commit();
    res.json(await loadQuiz(id));
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally { connection.release(); }
});

app.delete('/api/quizzes/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM quizzes WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/live-sessions', async (req, res) => {
  try {
    const { quiz_id, teacher_id } = req.body || {};
    if (!quiz_id) return res.status(400).json({ error: 'quiz_id is required' });
    const sessionId = uuid();
    let sessionCode;
    for (let i = 0; i < 10; i++) {
      sessionCode = `${Math.floor(100000 + Math.random() * 900000)}`;
      const [exists] = await pool.query('SELECT id FROM live_sessions WHERE session_code = ?', [sessionCode]);
      if (!exists.length) break;
    }
    const teacherId = validUuid(teacher_id) ? teacher_id : TEACHER_ID;
    await pool.query(
      `INSERT INTO live_sessions (id, quiz_id, session_code, teacher_id, status, current_question) VALUES (?, ?, ?, ?, 'waiting', 0)`,
      [sessionId, quiz_id, sessionCode, teacherId]
    );
    const [rows] = await pool.query('SELECT * FROM live_sessions WHERE id = ?', [sessionId]);
    res.json(mapSession(rows[0]));
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

app.get('/api/live-sessions/waiting', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM live_sessions WHERE quiz_id = ? AND status IN ('waiting','started') ORDER BY created_at DESC LIMIT 1`,
      [req.query.quizId]
    );
    res.json(rows.length ? mapSession(rows[0]) : null);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/live-sessions/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM live_sessions WHERE id = ?', [req.params.id]);
    res.json(rows.length ? mapSession(rows[0]) : null);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/live-sessions/:id/status', async (req, res) => {
  try {
    const status = req.body?.status === 'live' ? 'started' : req.body?.status === 'finished' ? 'ended' : 'waiting';
    if (status === 'started') {
      await pool.query(`UPDATE live_sessions SET status='started', started_at=COALESCE(started_at, CURRENT_TIMESTAMP) WHERE id=?`, [req.params.id]);
    } else if (status === 'ended') {
      await pool.query(`UPDATE live_sessions SET status='ended', ended_at=CURRENT_TIMESTAMP WHERE id=?`, [req.params.id]);
    } else {
      await pool.query(`UPDATE live_sessions SET status='waiting' WHERE id=?`, [req.params.id]);
    }
    const [rows] = await pool.query('SELECT * FROM live_sessions WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Session not found' });
    res.json(mapSession(rows[0]));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/live-sessions/:id/participants', async (req, res) => {
  const { quiz_id, student_id, student_name, avatar } = req.body || {};
  if (!validUuid(student_id)) return res.status(400).json({ error: 'A valid student_id is required' });
  const connection = await pool.getConnection();
  try {
    const participantId = uuid();
    const sid = String(student_id).toLowerCase();
    const name = String(student_name || 'Player').trim() || 'Player';
    await connection.beginTransaction();
    await connection.query(
      `INSERT INTO users (id, email, password_hash, full_name, role)
       VALUES (?, ?, '', ?, 'student') ON DUPLICATE KEY UPDATE full_name=VALUES(full_name)`,
      [sid, `guest-${sid}@quizspark.local`, name]
    );
    const [userRows] = await connection.query('SELECT id FROM users WHERE id=? LIMIT 1', [sid]);
    if (!userRows.length) throw new Error('Student account could not be created before joining the live quiz');
    await connection.query(
      `INSERT INTO live_participants (id, session_id, student_id, student_name, avatar, status, score)
       VALUES (?, ?, ?, ?, ?, 'joined', 0)
       ON DUPLICATE KEY UPDATE student_name=VALUES(student_name), avatar=VALUES(avatar), status='joined'`,
      [participantId, req.params.id, sid, name, avatar || '🚀']
    );
    const [rows] = await connection.query('SELECT * FROM live_participants WHERE session_id=? AND student_id=? LIMIT 1', [req.params.id, sid]);
    await connection.commit();
    res.json({ ...rows[0], quiz_id, avatar: rows[0].avatar || '🚀' });
  } catch (error) {
    await connection.rollback();
    console.error('[LIVE STUDENT] participant join failed', {
      sessionId: req.params.id,
      studentId: req.body?.student_id,
      error
    });
    res.status(500).json({ error: error.message });
  } finally { connection.release(); }
});

app.get('/api/live-sessions/:id/participants', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT lp.*, ls.quiz_id FROM live_participants lp JOIN live_sessions ls ON ls.id=lp.session_id WHERE lp.session_id=? ORDER BY lp.joined_at ASC`,
      [req.params.id]
    );
    const uniqueParticipants = new Map(rows.map(r => [r.student_id || r.id, { ...r, avatar: r.avatar || '🚀' }]));
    res.json([...uniqueParticipants.values()]);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/attempts', async (req, res) => {
  try {
    const a = req.body || {};
    const id = validUuid(a.id) ? a.id : uuid();
    const studentId = validUuid(a.student_id) ? a.student_id : null;
    await pool.query(
      `INSERT INTO quiz_attempts (id, quiz_id, student_id, student_name, total_score, correct_count, total_questions, accuracy_percentage, time_taken_seconds)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, a.quiz_id, studentId, a.student_name || 'Player', Number(a.total_score || 0), Number(a.correct_count || 0), Number(a.total_questions || 0), Number(a.accuracy_percentage || 0), Number(a.time_taken_seconds || 0)]
    );
    await pool.query(
      `INSERT INTO leaderboard (id, quiz_id, student_name, score, \`rank\`) VALUES (?, ?, ?, ?, 0)`,
      [uuid(), a.quiz_id, a.student_name || 'Player', Number(a.total_score || 0)]
    );
    const [rows] = await pool.query('SELECT * FROM quiz_attempts WHERE id=?', [id]);
    res.json(rows[0]);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/attempts', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM quiz_attempts WHERE quiz_id=? ORDER BY completed_at DESC', [req.query.quizId]);
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT student_name, MAX(score) AS score FROM leaderboard WHERE quiz_id=? GROUP BY student_name ORDER BY score DESC LIMIT 10`,
      [req.query.quizId]
    );
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

(async () => {
  try {
    await ensureDatabase();
    await pool.query('SELECT 1');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`QuizSpark MySQL API listening on port ${PORT}`);
      console.log(`Database: ${process.env.DB_NAME || 'quizspark'}`);
    });
  } catch (error) {
    console.error('\nCould not connect to MySQL. Check server/.env (DB_PASSWORD especially).\n', error.message);
    process.exit(1);
  }
})();
